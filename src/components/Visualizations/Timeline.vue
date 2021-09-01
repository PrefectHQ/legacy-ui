<script>
import * as d3 from 'd3'
import uniqueId from 'lodash.uniqueid'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'
import moment from '@/utils/moment'

// TODO: Remove the workerize-loader package and adjust this worker to
// a more classic pub/sub style
import TimelineWorker from 'workerize-loader?inline!@/workers/timeline'

import { formatTime } from '@/mixins/formatTimeMixin'
import { mapGetters } from 'vuex'

const xAxisHeight = 20
const minBarRadius = 10
const maxBarRadius = 25
const breakpointTooltipWidth = 185
const itemTooltipWidth = 375
const condensed = true

let hidden, visibilityChange
if (window) {
  if (typeof document.hidden !== 'undefined') {
    // Opera 12.10 and Firefox 18 and later
    hidden = 'hidden'
    visibilityChange = 'visibilitychange'
  } else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden'
    visibilityChange = 'msvisibilitychange'
  } else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden'
    visibilityChange = 'webkitvisibilitychange'
  }
}

export default {
  mixins: [formatTime],
  props: {
    barRadius: {
      type: Number,
      required: false,
      default: 15
    },
    breakpoints: {
      type: Array,
      required: false,
      default: () => []
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
    },
    items: {
      type: Array,
      required: false,
      default: () => []
    },
    live: {
      type: Boolean,
      required: false,
      default: false
    },

    // Bookends for the chart
    endTime: {
      type: [Number, String],
      required: false,
      default: null
    },
    startTime: {
      type: [Number, String],
      required: false,
      default: null
    }
  },
  data() {
    return {
      animationDuration: 500,
      drawTimeout: null,
      easing: 'easePolyInOut',
      firstRenderComplete: false,
      id: uniqueId('timeline'),
      hoveredBreakpoint: null,
      hoveredBreakpoints: null,
      hovered: null,
      hoveredItemIds: [],
      now: new Date(),
      showControls: true,
      showDebugControls: false, // These are useful for debugging
      showLabels: true,
      showTimestampAtCursor: false,
      updateXTimeout: null,
      worker: null,
      zoom: d3.zoom(),

      breakpointsUnwatch: null,
      endTimeUnwatch: null,
      itemUnwatch: null,
      liveUnwatch: null,
      pauseUpdatesUnwatch: null,
      startTimeUnwatch: null,

      followEdge: true,

      // DOM refs
      canvas: null,
      breakpointsNode: null,
      svg: null,
      xAxisNode: null,

      // Bars
      bars: [],
      barPadding: 0.2,

      domainStart: null,
      domainEnd: null,

      // Viewport extent
      viewportLeft: 0,
      viewportRight: 1,

      // Dimensions
      height_: null,
      width_: null,
      height: null,
      width: null,

      padding: {
        bottom: xAxisHeight,
        left: 5,
        right: 5,
        top: 20,
        x: 10,
        y: 25
      },

      interval: null,
      iterations: 0,
      live_: this.live,
      pauseUpdates: document[hidden],
      scaleExtent: [1, 10],
      translateExtent: [
        [-Infinity, -Infinity],
        [Infinity, Infinity]
      ],
      transform: d3.zoomIdentity,

      rowMap: {},
      rows: 1,

      // Scales
      x: d3.scaleTime(),
      y: d3.scaleBand(),
      xAxis: null
    }
  },
  computed: {
    ...mapGetters('user', ['user', 'timezone']),
    calcRows: function() {
      return debounce(() => {
        this.rawCalcRows()
      }, 300)
    },
    resizeChart: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawResizeChart)
      }, 500)
    },
    resizeCanvas: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawResizeCanvas)
      }, 300)
    },
    setChartDimensions: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawSetChartDimensions)
      }, 300)
    },
    start() {
      if (!this.startTime) return this.now
      return new Date(this.startTime)
    },
    end() {
      if (!this.endTime) return null
      return new Date(this.endTime)
    },
    breakpoints_() {
      const breakpoints = [...this.breakpoints]

      if (this.live_) {
        breakpoints.push({
          label: '(now)',
          time: this.now,
          color: 'var(--v-utilGrayMid-base)'
        })
      }

      if (this.hoveredBreakpoint) {
        breakpoints.push({
          label: this.hoveredBreakpoint.label,
          time: this.hoveredBreakpoint.time,
          color: 'var(--v-utilGrayMid-base)'
        })
      }

      return breakpoints.sort((a, b) => new Date(a.time) - new Date(b.time))
    },
    breakpointTooltipStyle() {
      if (!this.hovered) return
      let half = breakpointTooltipWidth / 2
      let p = this.boundingClientRect
      let overRight = this.hovered.x + half - p.width > 0
      let overLeft = this.hovered.x - half < 0
      return {
        left: `${
          overRight ? p.width - half : overLeft ? half : this.hovered.x
        }px`,
        top: `${this.hovered.y}px`,
        width: `${breakpointTooltipWidth}px`
      }
    },
    itemTooltipStyle() {
      if (!this.hovered) return
      let half = itemTooltipWidth / 2
      let p = this.boundingClientRect
      let overRight = this.hovered.x + half - p.width > 0
      let overLeft = this.hovered.x - half < 0
      return {
        left: `${
          overRight ? p.width - half : overLeft ? half : this.hovered.x
        }px`,
        top: `${this.hovered.y}px`,
        width: `${itemTooltipWidth}px`
      }
    },
    updateBars: function() {
      return throttle(
        () => {
          this.rawUpdateBars()
        },
        this.firstRenderComplete ? 32 : this.animationDuration
      )
    }
  },
  mounted() {
    this.worker = TimelineWorker({ type: 'module' })
    this.timer?.stop()

    this.canvas = d3.select(`#${this.id}-canvas`)
    this.svg = d3.select(`#${this.id}-svg`)

    this.xAxisNode = this.svg.append('g')
    this.breakpointsNode = this.svg.append('g')

    this.resizeChart()

    if (!this.loading) {
      this.calcRows()
    }

    window.addEventListener('resize', this.resizeChart)
    window.addEventListener(
      visibilityChange,
      this.handleVisibilityChange,
      false
    )

    this.setChartDimensions()

    this.canvas.on('click', this.click)
    this.canvas.on('mousemove', this.mousemove)
    this.canvas.on('mouseout', this.mouseout)

    this.live_ = this.live

    this.breakpointsUnwatch = this.$watch(
      'breakpoints',
      debounce(function() {
        if (this.pauseUpdates) return
        this.updateBreakpoints(true)
      }, 500)
    )
    this.itemUnwatch = this.$watch(
      'items',
      debounce(function() {
        if (this.pauseUpdates) return
        this.calcRows()
        this.updateBars()
      }, 500),
      { deep: true }
    )

    this.endTimeUnwatch = this.$watch('endTime', () => {
      if (this.pauseUpdates) return
      this.updateScales()
    })

    this.liveUnwatch = this.$watch('live', val => {
      this.live_ = val
    })

    this.startTimeUnwatch = this.$watch('startTime', () => {
      if (this.pauseUpdates) return
      this.updateScales()
    })

    this.pauseUpdatesUnwatch = this.$watch('pauseUpdates', val => {
      if (!val && !this.live_) {
        this.updateScales()
      }
    })
  },
  beforeDestroy() {
    this.worker?.terminate()
    this.worker = null
    this.timer?.stop()
    this.interval?.stop()
    window.removeEventListener('resize', this.resizeChart)
    window.removeEventListener(visibilityChange, this.handleVisibilityChange)

    this.canvas.on('.zoom', null)
    this.canvas.on('click', null)
    this.canvas.on('mousemove', null)
    this.canvas.on('mouseout', null)
    this.xAxisNode.on('end', null)

    this.itemUnwatch()
    this.breakpointsUnwatch()
    this.endTimeUnwatch()
    this.liveUnwatch()
    this.startTimeUnwatch()
    this.pauseUpdatesUnwatch()
  },
  methods: {
    async rawCalcRows() {
      const prevRows = this.rows
      const { rowMap, rows } = await this.worker.GenerateRows(this.items)

      this.rows = rows
      this.rowMap = rowMap
      if (this.rows !== prevRows) this.updateScales()
    },
    click(e) {
      const context = this.canvas.node().getContext('2d')
      let hoveredId,
        hovered = {
          data: [],
          x: e.offsetX,
          y: this.height
        }
      let x = (e.offsetX - this.transform.x) * (1 / this.transform.k)
      let y = e.offsetY * (1 / this.transform.k)

      for (let i = 0; i < this.bars.length; ++i) {
        const bar = this.bars[i]
        if (context.isPointInPath(bar.path2D, x, y)) {
          hoveredId = bar.id
          hovered.data.push(bar)

          this.canvas._groups[0][0].style.cursor = 'pointer'
        }
      }

      if (!hoveredId || hoveredId !== this.hoveredItemId) {
        this.updateBars()
      }

      this.hoveredItemId = hoveredId
      this.$emit('click', { id: hoveredId, ...hovered })
    },
    breaklineMouseout() {
      this.hoveredBreakpoints = null
      this.hovered = null
      this.$emit('breakpoint-hover', null)
    },
    breaklineMouseover(e) {
      this.hoveredBreakpoints = e.currentTarget?.__data__.breakpoints
      this.hovered = {
        x: e.offsetX,
        y: this.height
      }
      this.$emit('breakpoint-hover', e.currentTarget?.__data__)
    },
    mousemove(e) {
      if (this.showTimestampAtCursor) {
        this.hoveredBreakpoint = {
          time: this.x.invert(
            (e.offsetX - this.transform.x) * (1 / this.transform.k)
          ),
          label: this.logTimeExtended(
            new Date(
              this.x.invert(
                (e.offsetX - this.transform.x) * (1 / this.transform.k)
              )
            )
          )
        }
        this.updateBreakpoints()
      }

      const context = this.canvas.node().getContext('2d')
      let hoveredIds = []
      let hovered = {
        data: [],
        x: e.offsetX,
        y: this.height
      }
      let x = (e.offsetX - this.transform.x) * (1 / this.transform.k)
      let y = e.offsetY * (1 / this.transform.k)

      for (let i = 0; i < this.bars.length; ++i) {
        const bar = this.bars[i]
        if (context.isPointInPath(bar.path2D, x, y)) {
          hoveredIds.push(bar.id)
          hovered.data.push(bar)

          this.canvas._groups[0][0].style.cursor = 'pointer'
        }
      }

      if (
        (!hoveredIds.length && this.hoveredItemIds.length) ||
        hoveredIds.some(h => !this.hoveredItemIds.includes(h)) ||
        hoveredIds.length !== this.hoveredItemIds.length
      ) {
        if (!hoveredIds.length) this.canvas._groups[0][0].style.cursor = null

        this.$emit('hover', { ids: hoveredIds, ...hovered })
        this.updateBars()
      }

      this.hoveredItemIds = hoveredIds
      this.hovered = hovered
    },
    mouseout() {
      this.hoveredBreakpoint = null
      this.updateBreakpoints()

      // if we don't have a hovered item already
      // we don't need to do anything
      if (!this.hoveredItemIds.length) return
      this.hoveredItemIds = []
      this.hovered = null

      this.canvas._groups[0][0].style.cursor = null
      this.updateBars()
      this.$emit('hover', null)
    },
    newXAxis(x) {
      let day
      let meridiem

      return d3
        .axisBottom(x)
        .ticks(7)
        .tickSizeOuter(0)
        .tickFormat(d => {
          const t = moment(d).tz(this.timezone)
          const dateObj = t ? t : moment(d)
          const dayWeek = dateObj.day()
          const hours = dateObj.hour() < 12 ? 'am' : 'pm'

          const shortened =
            day && dayWeek === day && meridiem && hours === meridiem

          if (!shortened) {
            day = dayWeek
            meridiem = hours
          }

          const formatted = dateObj.calendar(null, {
            sameDay: `h:mm${shortened ? '' : 'a'}`,
            nextDay: 'D MMM h:mm',
            nextWeek: 'D MMM h:mm',
            lastDay: `${shortened ? '' : '[Yesterday at]'} h:mm${
              shortened ? '' : 'a'
            }`,
            lastWeek: `${shortened ? '' : 'D MMM [at] '}h:mm${
              shortened ? '' : 'a'
            }`,
            sameElse: `${shortened ? '' : 'D MMM [at] '}h:mm${
              shortened ? '' : 'a'
            }`
          })

          return `${formatted}`
        })
    },
    render(elapsed) {
      const t = Math.min(
        1,
        elapsed /
          (this.live_ && this.firstRenderComplete ? 1 : this.animationDuration)
      )

      const context = this.canvas.node().getContext('2d')
      context.save()
      context.clearRect(0, 0, this.width_, this.height_)
      context.translate(this.transform.x, 1)
      context.scale(this.transform.k, this.transform.k)

      let len = this.bars.length

      for (let i = 0; i < len; ++i) {
        context.beginPath()
        const bar = this.bars[i]

        const isHovered = this.hoveredItemIds.includes(bar.id)

        bar.alpha = isHovered
          ? 1
          : this.hoveredItemIds.length
          ? 0.5
          : bar.alpha || 1
        bar.x = bar.x0 * (1 - t) + bar.x1 * t
        bar.y = bar.y0 * (1 - t) + bar.y1 * t
        bar.height = bar.height0 * (1 - t) + bar.height1 * t

        bar.width = bar.width0 * (1 - t) + bar.width1 * t
        bar.shadow = bar.shadow0 * (1 - t) + bar.shadow1 * t

        this.bars[i].path2D = new Path2D()

        const radius = (bar.height / 2) * (1 / this.transform.k)
        const x = bar.x + radius / 2
        const y = bar.y * (1 / this.transform.k)

        let offset = 0
        context.globalAlpha = bar.alpha || 1

        // Create outline of the bar
        if (bar.shadow && (!this.hoveredItemIds.length || isHovered)) {
          context.beginPath()
          // context.lineWidth = 1 * (1 / this.transform.k)
          // context.strokeStyle = colors[0]
          context.fillStyle = 'var(--v-utilGrayLight-base)'
          context.shadowColor = 'var(--v-utilGrayMid-base)'
          context.shadowBlur = bar.shadow
          const compress = 2 * (1 / this.transform.k)
          const x = bar.x + radius / 2 + compress / 2
          const width = bar.width - radius * 2 - compress

          context.arc(
            x,
            y + radius,
            radius - compress / 2,
            -(90 * Math.PI) / 180,
            -(270 * Math.PI) / 180,
            true
          )

          context.arc(
            x + width,
            y + radius,
            radius - compress / 2,
            (90 * Math.PI) / 180,
            (270 * Math.PI) / 180,
            true
          )
          context.closePath()
          context.fill()
          // End create outline of the bar
        }

        context.shadowBlur = 0
        context.strokeStyle = getComputedStyle(document.body).getPropertyValue(
          '--v-appForeground-base'
        )
        context.lineWidth = 2 / this.transform.k

        bar.colors.forEach((color, j) => {
          context.beginPath()

          context.fillStyle = color.color || 'var(--v-utilGrayLight-base)'

          const capLeft = new Path2D(),
            capRight = new Path2D(),
            rect = new Path2D()

          const calcWidth = (bar.width - radius * 2) * color.value
          const width = calcWidth < 0 ? 0 : calcWidth

          rect.rect(
            x + offset,
            y + (width <= 0 ? context.lineWidth : 0),
            width,
            radius * 2 - (width <= 0 ? context.lineWidth : 0)
          )

          if (j === 0) {
            capLeft.arc(
              x,
              y + radius,
              radius,
              -(90 * Math.PI) / 180,
              -(270 * Math.PI) / 180,
              true
            )

            rect.addPath(capLeft)
            context.stroke(capLeft)
          }

          if (j === bar.colors.length - 1) {
            capRight.arc(
              x + width + offset,
              y + radius,
              radius,
              (90 * Math.PI) / 180,
              (270 * Math.PI) / 180,
              true
            )

            rect.addPath(capRight)

            context.stroke(capRight)
          }

          if (width <= 0) {
            capLeft.addPath(capRight)
            context.fill(capLeft)
          } else {
            context.fill(rect)
          }

          // Fill the shape but add the shape to the reference
          // path, so we can calculation intersections
          this.bars[i].path2D.addPath(rect)
          this.bars[i].path2D.addPath(capLeft)
          this.bars[i].path2D.addPath(capRight)
          offset += width
        })

        // These are pretty fuzzy right now
        // so we'll probably want to move them to the svg layer
        if (bar.label && !condensed) {
          const savedStrokeStyle = context.fillStyle
          const fontSize = 10 * (1 / this.transform.k)
          const textY = (9 + bar.y + bar.height) * (1 / this.transform.k)

          const tX = bar.x + this.transform.x / this.transform.k
          const x1 = bar.width + bar.x
          const overLeft = tX < 0
          // const overRight = transformedX > this.width_ / this.transform.k

          const leftEdge = -(this.transform.x / this.transform.k)
          const textX = overLeft
            ? leftEdge > x1
              ? bar.width + bar.x
              : leftEdge
            : bar.x

          context.font = `${fontSize}px Roboto`
          // context.textAlign = overLeft && leftEdge > tX1 ? 'end' : 'start'
          context.textAlign = 'start'
          context.fillStyle = 'var(--v-utilGrayMid-base)'
          context.fillText(bar.label, textX, textY)
          context.fillStyle = savedStrokeStyle
        }
      }

      context.restore()

      if (t === 1) {
        this.timer.stop()
        this.bars = this.bars.filter(b => !b.leaving)
        this.firstRenderComplete = true
      }
    },
    rawUpdateBars() {
      const height =
        (this.y.bandwidth() > maxBarRadius
          ? maxBarRadius
          : this.y.bandwidth()) ?? 0

      const calcBar = item => {
        if (this.pauseUpdates) return

        const x =
          (item.start_time
            ? this.x(new Date(item.start_time))
            : this.x(this.now) + 20) ?? 0

        const width = item.end_time
          ? this.x(new Date(item.end_time)) - x
          : item.start_time
          ? this.x(this.now) - x
          : 0

        const y =
          (this.y(this.rowMap[item.id]) ?? 0) + (this.y.bandwidth() - height)

        const alpha = 1

        const barIndex = this.bars.findIndex(b => b.id == item.id)

        const label = item.label

        // If the item isn't present in the bar array
        // we instantiate a new bar...
        if (barIndex === -1) {
          this.bars.push({
            ...item,
            alpha: alpha,
            height0: height,
            height1: height,
            height: height,
            label: label,
            row: this.rowMap[item.id],
            shadow: 0,
            shadow0: 0,
            shadow1: item.shadow ? 5 : 0,
            width0: 0,
            width1: width,
            width: 0,
            x0: x || 0,
            x1: x,
            x: x || 0,
            y0: y,
            y1: y,
            y: y
          })
        } else {
          // ...otherwise we update the existing bar with
          // new values
          const bar = this.bars[barIndex]

          const bar1 = {
            ...item,
            alpha: alpha,
            height0: bar.height,
            height1: height,
            height: bar.height,
            row: this.rowMap[item.id],
            shadow: bar.shadow,
            shadow0: bar.shadow,
            shadow1: item.shadow ? 5 : 0,
            width0: bar.width,
            width1: width,
            width: bar.width,
            x0: bar.x,
            x1: x,
            x: bar.x,
            y0: bar.y,
            y1: y,
            y: bar.y
          }

          this.bars[barIndex] = { ...bar, ...bar1, ...item }
        }
      }

      this.items.forEach(calcBar)

      // Check our existing bars against current data
      this.bars
        // If this is a valid bar, do nothing since its data was already
        // updated
        .filter(bar => !this.items.find(item => item.id == bar.id))
        // ...otherwise we'll start the exit animation
        .forEach((bar, i) => {
          const bar1 = {
            height0: bar.height,
            height1: height,
            height: bar.height,
            width0: bar.width,
            width1: 0,
            width: bar.width,
            x0: bar.x,
            x1: bar.x,
            x: bar.x,
            y0: bar.y,
            y1: bar.y,
            y: bar.y,
            leaving: true
          }

          this.bars[i] = { ...bar, ...bar1 }
        })

      if (this.timer) {
        this.timer.restart(this.render)
      } else {
        this.timer = d3.timer(this.render)
      }
    },
    play() {
      this.pauseUpdates = false
      this.updateX()
    },
    playOrPause() {
      this.pauseUpdates ? this.play() : this.pause()
    },
    pause() {
      this.pauseUpdates = true
    },
    rawResizeChart() {
      let parent = this.canvas.select(function() {
        return this.parentNode
      })?._groups?.[0]?.[0]

      let computedStyle = window.getComputedStyle(parent, null)

      // This is the padding that the parent element has
      // NOT the internal padding
      let padding = {
        left: parseFloat(computedStyle.getPropertyValue('padding-left')),
        right: parseFloat(computedStyle.getPropertyValue('padding-right')),
        top: parseFloat(computedStyle.getPropertyValue('padding-top')),
        bottom: parseFloat(computedStyle.getPropertyValue('padding-bottom'))
      }

      this.boundingClientRect = this.$refs['parent']?.getBoundingClientRect()

      this.width = Math.floor(parent.clientWidth - padding.left - padding.right)

      // If a height is specified in the component
      // we use that, otherwise we assume infinite height and
      // let the component expand based on the min
      // bar radius
      this.height = Math.floor(
        parent.clientHeight - padding.top - padding.bottom
      )

      if (!this.width_ || (this.width && this.width_ !== this.width)) {
        this.setChartDimensions()
      }
    },
    rawSetChartDimensions() {
      this.pause()
      clearTimeout(this.drawTimeout)

      if (!this.height || this.height <= 0) {
        return
      }

      this.svg
        .attr('viewbox', `0 0 ${this.width} ${this.height}`)
        .attr('width', this.width)
        .attr('height', this.height)

      this.width_ = this.width

      this.xAxisNode
        .attr('class', 'x-axis-group')
        .style(
          'transform',
          `translate(0, ${this.height - this.padding.bottom}px)`
        )

      this.resizeCanvas()
      this.updateScales()

      const filter = () => {
        return event.isTrusted
      }

      // We use a timeout to account for the transition
      // period when redrawing the canvas and svg nodes
      this.drawTimeout = setTimeout(() => {
        this.play()

        this.zoom
          .scaleExtent(this.scaleExtent)
          .translateExtent(this.translateExtent)
          .on('zoom', this.zoomed)
          .filter(filter)

        // Sets the initial transform
        // and updates the scales and breakpoints
        this.zoomed({ transform: d3.zoomIdentity })

        // Adds the zoom entity
        // to the canvas element
        this.canvas.call(this.zoom)
      }, this.animationDuration)
    },
    rawResizeCanvas() {
      const fullHeight =
        this.rows * minBarRadius +
        this.rows * minBarRadius * this.barPadding * 2

      this.height_ =
        (condensed
          ? this.height - this.padding.y
          : Math.max(fullHeight, this.height) - this.padding.y) -
        this.padding.bottom

      this.canvas
        .style('width', `${this.width_}px`)
        .style('height', `${this.height_}px`)
        .attr('width', this.width_)
        .attr('height', this.height_)
        .style('transform', `translate(0, ${this.padding.y * 0.75}px)`)

      this.updateScales()
    },
    updateBreakpoints(shouldTransition) {
      this.breakpointsNode.attr(
        'transform',
        () => `translate(${this.transform.x} 5) scale(${this.transform.k})`
      )

      const breakpoints = this.breakpoints_
      const breakpointGroups = []

      for (let i = 0; i < this.breakpoints_.length; ++i) {
        const d = breakpoints[i]
        const x = d.time ? this.x(new Date(d.time)) : -20
        const intersectionIndex = breakpointGroups.findIndex(
          g =>
            x <= g.x + 40 * (1 / this.transform.k) &&
            x >= g.x - 40 * (1 / this.transform.k)
        )

        if (intersectionIndex > -1) {
          breakpointGroups[intersectionIndex].breakpoints.push({
            id: i,
            x: x,
            ...d
          })

          // This section is used to aggregate breakpoints at the median
          // instead of at the mean.
          // breakpointGroups[intersectionIndex].breakpoints.sort(
          //   (a, b) => a.x - b.x
          // )
          // const median = Math.ceil(
          //   breakpointGroups[intersectionIndex].breakpoints.length / 2
          // )
          // breakpointGroups[intersectionIndex].x =
          //   breakpointGroups[intersectionIndex].breakpoints[median].x

          breakpointGroups[intersectionIndex].x =
            breakpointGroups[intersectionIndex].breakpoints.reduce(
              (acc, b) => acc + b.x,
              0
            ) / breakpointGroups[intersectionIndex].breakpoints.length

          breakpoints[i].group_ref = intersectionIndex
          breakpoints[i].x = x
        } else {
          breakpoints[i].group_ref = breakpointGroups.push({
            breakpoints: [{ id: i, x: x, ...d }],
            x: x
          })

          breakpoints[i].x = x
        }
      }

      const breakpointsGroup = this.breakpointsNode
        .selectAll('.breakpoints-group')
        .data(breakpointGroups)

      breakpointsGroup.join(
        enter => {
          const g = enter
            .append('g')
            .attr('class', 'breakpoints-group')
            .style('opacity', 1)
            .attr(
              'transform',
              d => `translate(${d.x}) scale(${1 / this.transform.k})`
            )

          g.append('path')
            .attr('stroke', 'var(--v-utilGrayMid-base)')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', 5)
            .attr('d', `M0,${this.height - 25}L0,10`)
            .style('pointer-events', 'none')
            .style('opacity', this.firstRenderComplete ? 1 : 0)
            .transition()
            .delay((d, i) => i * 50)
            .duration(this.animationDuration)
            .style('opacity', 1)

          g.append('text')
            .style('font-size', '8px')
            .style('pointer-events', 'none')
            .attr('fill', 'var(--v-utilGrayMid-base)')
            .attr('alignment-baseline', 'hanging')
            .attr('text-anchor', d => d.anchor || 'middle')
            .style('user-select', 'none')
            .text(d => {
              if (d.breakpoints.length === 1) {
                let breakpoint = d.breakpoints[0]
                return this.showLabels
                  ? breakpoint.label
                  : this.logTimeExtended(new Date(breakpoint.time))
              } else {
                return `${d.breakpoints.length}+ states`
              }
            })
            .attr('y', 1)
            .attr('x', 0)
            .style('opacity', this.firstRenderComplete ? 1 : 0)
            .transition()
            .delay((d, i) => i * 50)
            .duration(50)
            .style('opacity', 1)

          return g
            .on('mouseover', this.breaklineMouseover)
            .on('mouseout', this.breaklineMouseout)
            .call(enter =>
              enter
                .transition('enter')
                .duration(16)
                .style('opacity', 1)
            )
        },
        update =>
          update.call(update => {
            update
              .select('path')
              .transition('update')
              .duration(this.animationDuration)
              .attr('stroke', 'var(--v-utilGrayMid-base)')

            update
              .select('text')
              .attr('text-anchor', d => d.anchor || 'middle')
              .text(d => {
                if (d.breakpoints.length === 1) {
                  let breakpoint = d.breakpoints[0]
                  return this.showLabels
                    ? breakpoint.label
                    : this.logTimeExtended(new Date(breakpoint.time))
                } else {
                  return `${d.breakpoints.length}+ states`
                }
              })
              .transition()
              .delay(50)
              .duration(50)
              .style('opacity', 1)

            return update.call(update =>
              update
                .transition('update')
                .duration(shouldTransition ? 16 : 0)
                .attr(
                  'transform',
                  d => `translate(${d.x}) scale(${1 / this.transform.k})`
                )
            )
          }),
        exit => {
          return exit
            .on('mouseover', null)
            .on('mouseout', null)
            .call(exit =>
              exit
                .transition('exit')
                .duration(50)
                .style('opacity', 0)
                .remove()
            )
        }
      )

      const radius = 5

      breakpointsGroup
        .selectAll('.breakline-circle')
        .data(d => d.breakpoints)
        .join(
          enter => {
            const g = enter
              .append('circle')
              .attr('class', 'breakline-circle')
              .style('cursor', 'pointer')
              .attr('id', d => `circle-${d.id}`)
              .style('opacity', 1)

            g.attr('cy', this.height - 25)
              .attr('cx', (d, i, arr) => {
                let median = Math.ceil(arr.length / 2) - 1
                return (
                  (i - median) * 5 - (arr.length % 2 === 0 ? radius / 2 : 0)
                )
              })
              .attr('r', radius)
              .attr('stroke-width', 0.5)
              .attr('stroke', 'var(--v-appForeground-base)')
              .attr('fill', d => d.color)

            return g
          },
          update => {
            return update
              .attr('fill', d => d.color)
              .style('opacity', 1)
              .call(update =>
                update
                  .transition('update')
                  .duration(50)
                  .attr('cx', (d, i, arr) => {
                    let median = Math.ceil(arr.length / 2) - 1
                    return (
                      (i - median) * 5 - (arr.length % 2 === 0 ? radius / 2 : 0)
                    )
                  })
              )
          },
          exit => {
            return exit.call(exit =>
              exit
                .transition('exit')
                .duration(50)
                .style('opacity', 0)
                .remove()
            )
          }
        )
    },
    updateX(shouldTransition) {
      clearTimeout(this.updateXTimeout)
      // Passing true to this method
      // removes the duration from the axis transitions
      // meaning we can keep the scales in sync with user actions
      // like zooming and panning
      const x = this.transform.rescaleX(this.x)
      const xAxis = this.newXAxis(x)
      this.now = new Date()

      this.updateBars()
      this.updateBreakpoints(shouldTransition)

      if (this.live_ && !this.pauseUpdates) {
        this.updateXTimeout = setTimeout(() => {
          this.updateScales()
        }, this.animationDuration)
      }

      // We only need this section if we want to draw the x-axis
      this.xAxisNode
        .transition()
        .duration(shouldTransition ? 64 : 0)
        .call(xAxis)
        .on('end', () => {
          this.xAxisNode.on('end', null)
          this.updateBars()
          this.updateBreakpoints(shouldTransition)

          if (this.live_ && !this.pauseUpdates) {
            this.updateScales()
            ++this.iterations
          }
        })
    },
    updateScales() {
      if (!this.height_ || !this.width_) return

      const prevDomainEnd = this.domainEnd

      this.now = new Date()
      const startMs = this.start?.getTime() ?? 0
      const endMs = (this.end ?? this.now).getTime()
      const domainPadding = (endMs - startMs) * 0.025
      this.domainStart = new Date(startMs - domainPadding)
      this.domainEnd = new Date(endMs + domainPadding)

      this.x.range([this.padding.left, this.width_ - this.padding.right])
      this.x.domain([this.domainStart, this.domainEnd])
      this.y.domain([...Array(this.rows).keys()])
      this.y.paddingInner(this.barPadding)
      this.y.paddingOuter(this.barPadding * 2)
      this.y.range([0, this.height_])

      // This is the the smallest period represented by the full graph
      // i.e. if zoomed in to the max extent the length of time the
      // graph will show.
      // Duration of entire run / smallest period (ms)
      // We default to 5 seconds right now.
      const scaleExtentUpper = (endMs - startMs) / 5000
      this.scaleExtent = [1, scaleExtentUpper < 2 ? 2 : scaleExtentUpper]

      this.translateExtent = [
        [0, 0],
        [this.width_, 0]
      ]

      if (prevDomainEnd && this.transform.k !== 1) {
        const translateBy = this.x(prevDomainEnd) - this.x(this.domainEnd)

        this.transform.x += translateBy

        this.canvas.call(this.zoom, this.transform)
      } else {
        this.canvas.call(this.zoom)
      }

      this.updateX(true)
    },
    statusStyle(state) {
      return {
        'border-radius': '50%',
        display: 'inline-block',
        'background-color': `var(--v-${state}-base)`,
        height: '1rem',
        width: '1rem'
      }
    },
    zoomed({ transform }) {
      this.transform = transform
      this.updateX()
    },
    collapse() {
      this.resizeCanvas()
    },
    handleVisibilityChange() {
      this.pauseUpdates = document[hidden]
    },
    panLeft() {
      this.canvas
        .transition()
        .duration(500)
        .call(this.zoom.translateBy, 200, 0)
    },
    panRight() {
      this.canvas
        .transition()
        .duration(500)
        .call(this.zoom.translateBy, -200, 0)
    },
    redraw() {
      const context = this.canvas.node().getContext('2d')
      context.clearRect(0, 0, this.width_, this.height_)
      this.bars = []
      this.firstRenderComplete = false
      this.resizeChart()
      this.setChartDimensions()
    },
    zoomIn() {
      this.canvas
        .transition()
        .duration(500)
        .call(this.zoom.scaleBy, 2)
    },
    zoomOut() {
      this.canvas
        .transition()
        .duration(500)
        .call(this.zoom.scaleBy, 0.5)
    }
  }
}
</script>

<template>
  <div
    ref="parent"
    class="position-relative timeline-container"
    style="height: 100%;"
  >
    <div
      v-if="showControls"
      class="controls-overlay d-flex flex-column align-center"
      multiple
    >
      <v-btn
        small
        depressed
        icon
        tile
        color="utilGrayMid"
        :disabled="transform.k == scaleExtent[1]"
        @click="zoomIn"
      >
        <v-icon>add</v-icon>
      </v-btn>

      <div class="d-flex">
        <v-btn
          small
          icon
          depressed
          tile
          color="utilGrayMid"
          :disabled="transform.k === 1 || transform.x == translateExtent[0][0]"
          @click="panLeft"
        >
          <v-icon>arrow_left</v-icon>
        </v-btn>
        <v-btn
          small
          icon
          depressed
          tile
          color="utilGrayMid"
          :disabled="
            transform.k === 1 ||
              transform.k * translateExtent[1][0] + transform.x <=
                translateExtent[1][0]
          "
          @click="panRight"
        >
          <v-icon>arrow_right</v-icon>
        </v-btn>
      </div>

      <v-btn
        small
        depressed
        icon
        tile
        color="utilGrayMid"
        :disabled="transform.k == scaleExtent[0]"
        @click="zoomOut"
      >
        <v-icon>remove</v-icon>
      </v-btn>
    </div>

    <v-menu bottom left :close-on-content-click="false">
      <template #activator="{ on }">
        <v-btn icon small class="input-menu" v-on="on">
          <v-icon>more_vert</v-icon>
        </v-btn>
      </template>

      <v-list dense tile class="d-flex justify-middle align-end flex-column">
        <v-list-item v-if="showDebugControls" class="d-flex  my-4">
          <v-btn
            small
            :disabled="transform.k == scaleExtent[1]"
            @click="zoomIn"
          >
            +
          </v-btn>
          <v-btn
            small
            class="ml-2"
            :disabled="transform.k == scaleExtent[0]"
            @click="zoomOut"
          >
            -
          </v-btn>

          <v-btn
            small
            class="ml-12"
            :disabled="
              transform.k === 1 || transform.x == translateExtent[0][0]
            "
            @click="panLeft"
          >
            ←
          </v-btn>
          <v-btn
            small
            class="ml-2"
            :disabled="
              transform.k === 1 ||
                transform.k * translateExtent[1][0] + transform.x <=
                  translateExtent[1][0]
            "
            @click="panRight"
          >
            →
          </v-btn>
        </v-list-item>

        <v-list-item
          v-if="showDebugControls"
          class="text-caption text-right d-flex flex-column justify-space-around"
        >
          <span>
            Scale:
            <span class="font-weight-medium">
              {{ Math.round(transform.k * 100) / 100 }}
            </span>
          </span>
          <span>
            Transform
            <span class="font-weight-medium">
              {{ Math.round(transform.x * 100) / 100 }},
              {{ Math.round(transform.y * 100) / 100 }}
            </span>
          </span>
          <span>
            Translate Extent
            <span class="font-weight-medium"> {{ translateExtent }}, </span>
          </span>
        </v-list-item>

        <v-list-item>
          <v-checkbox
            v-model="showControls"
            label="Show Controls"
            hide-details
            class="v-input--reverse input-menu-item ma-0"
          ></v-checkbox>
        </v-list-item>

        <v-list-item>
          <v-checkbox
            v-model="showLabels"
            label="Breakpoint Labels"
            hide-details
            class="v-input--reverse input-menu-item ma-0"
            @change="updateBreakpoints"
          ></v-checkbox>
        </v-list-item>

        <v-list-item>
          <v-checkbox
            v-model="showTimestampAtCursor"
            label="Cursor Timestamp"
            hide-details
            class="v-input--reverse input-menu-item ma-0"
            @change="updateBreakpoints"
          ></v-checkbox>
        </v-list-item>

        <v-list-item v-if="showDebugControls" @click="playOrPause">
          {{ pauseUpdates ? 'Play' : 'Pause' }}
        </v-list-item>

        <v-list-item v-if="showDebugControls" @click="collapse">
          {{ condensed_ ? 'Expand' : 'Collapse' }}
        </v-list-item>

        <v-list-item v-if="showDebugControls" @click="redraw">
          Redraw
        </v-list-item>
      </v-list>
    </v-menu>

    <canvas :id="`${id}-canvas`" class="canvas mx-auto" />
    <svg :id="`${id}-svg`" class="svg" />

    <div
      v-if="hoveredItemIds.length && $slots['item-tooltip']"
      class="timeline-tooltip"
      :style="itemTooltipStyle"
    >
      <slot name="item-tooltip" />
    </div>

    <div
      v-if="hoveredBreakpoints && $slots['breakpoint-tooltip']"
      class="timeline-tooltip"
      :style="breakpointTooltipStyle"
    >
      <slot name="breakpoint-tooltip" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.input-menu {
  opacity: 0.35;
  position: absolute;
  right: 0;
  top: -20px;
  z-index: 2;
}

.timeline-container {
  position: relative;

  .controls-overlay {
    background-color: var(--v-appForeground-base);
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
      1px 2px 2px 0 rgba(0, 0, 0, 0.14), 3px 1px 5px 0 rgba(0, 0, 0, 0.12) !important;
    position: absolute;
    right: -50px;
    top: 50%;
    transform: translate(0, -60%);
    transition: all 250ms;
    z-index: 2;

    > .v-btn {
      width: 100%;
    }

    &:focus,
    &:hover {
      opacity: 1;
    }

    @media only screen and (max-width: 1440px) {
      box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
        -1px 2px 2px 0 rgba(0, 0, 0, 0.14),
        -5px 1px 5px -4px rgba(0, 0, 0, 0.12) !important;
      margin-right: -12px;
      opacity: 0.85;
      right: 0;
    }
  }
}

.svg {
  box-sizing: border-box;
  z-index: 0;
}

.canvas {
  box-sizing: border-box;
  cursor: grab;
  position: absolute;
  z-index: 1;
}

.timeline-tooltip {
  pointer-events: none;
  position: absolute;
  text-overflow: initial;
  transform: translate(-50%);
  transition: all 150ms;
  user-select: none;
  z-index: 4;
}
</style>

<style lang="scss">
// We use unscoped css here
// so that we don't need to do a post-selection
// on the axis
.x-axis-group {
  color: var(--v-utilGrayLight-base) !important;
  font: 10px Roboto, sans-serif;
  opacity: 0.8;
  user-select: none;

  .domain {
    stroke: rgba(0, 0, 0, 0.12);
    stroke-width: 1.65px;
  }

  .tick line {
    stroke: rgba(0, 0, 0, 0.12);
    stroke-width: 1.65px;
  }

  .tick {
    transition: all 50ms;
  }

  .tick:first-of-type {
    text-anchor: start;
  }

  .tick:last-of-type {
    text-anchor: end;
  }
}

.breakpoints-group {
  opacity: 1;
}
</style>
