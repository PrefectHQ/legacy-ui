<script>
import * as d3 from 'd3'
import uniqueId from 'lodash.uniqueid'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'

const formatTime = d3.timeFormat('%-I:%M:%S')
const formatTimeExtended = d3.timeFormat('%a %-I:%M:%S %p')

export default {
  props: {
    barRadius: {
      type: Number,
      required: false,
      default: 25
    },
    breakpoints: {
      type: Array,
      required: false,
      default: () => []
    },
    collapsed: {
      type: Boolean,
      required: false,
      default: false
    },
    // height: {
    //   type: [Number, String],
    //   required: false,
    //   default: null
    // },
    minBarRadius: {
      type: Number,
      required: false,
      default: null
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
      collapsed_: this.collapsed,
      drawTimeout: null,
      easing: 'easePolyInOut',
      id: uniqueId('timeline'),
      hoveredId: null,
      now: new Date(),
      showControls: false, // These are useful for debugging
      zoom: d3.zoom(),

      followEdge: true,

      // DOM refs
      canvas: null,
      breakpointsNode: null,
      svg: null,
      xAxisNode: null,

      // Bars
      bars: [],
      barPadding: 0.3,

      domainStart: null,
      domainEnd: null,

      // Viewport extent
      viewportLeft: 0,
      viewportRight: 1,

      // Dimensions
      height_: null,
      width_: null,

      padding: {
        bottom: 5,
        left: 5,
        right: 5,
        top: 5,
        x: 10,
        y: 10
      },

      interval: null,
      iterations: 0,
      live_: this.live,
      pauseUpdates: false,
      scaleExtent: [1, 10],
      translateExtent: [
        [-Infinity, -Infinity],
        [Infinity, Infinity]
      ],
      transform: d3.zoomIdentity,

      // Scales
      x: d3.scaleTime(),
      y: d3.scaleBand(),
      xAxis: null
    }
  },
  computed: {
    resizeChart: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawResizeChart)
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
      if (!this.live_) return this.breakpoints
      return [
        ...this.breakpoints,
        {
          label: '(now)',
          time: this.now,
          color: '#999'
        }
      ]
    },
    updateBars: function() {
      return throttle(() => {
        this.rawUpdateBars()
      }, 100)
    }
  },
  watch: {
    breakpoints: {
      deep: true,
      handler: debounce(function() {
        if (this.pauseUpdates) return
        this.updateBreakpoints()
      }, 500)
    },
    items: {
      deep: true,
      handler: debounce(function() {
        if (this.pauseUpdates) return
        this.updateBars()
      }, 500)
    },
    live(val) {
      this.live_ = val
    }
  },
  mounted() {
    this.timer?.stop()

    this.canvas = d3.select(`#${this.id}-canvas`)
    this.svg = d3.select(`#${this.id}-svg`)

    this.xAxisNode = this.svg.append('g')
    this.breakpointsNode = this.svg.append('g')

    window.addEventListener('resize', this.resizeChart)
    requestAnimationFrame(this.resizeChart)

    this.canvas.on('click', this.click)
    this.canvas.on('mousemove', this.mousemove)
    this.canvas.on('mouseout', this.mouseout)

    this.live_ = this.live
  },
  beforeDestroy() {
    this.timer?.stop()
    this.interval?.stop()
    window.removeEventListener('resize', this.resizeChart)
    this.canvas.on('.zoom', null)
    this.canvas.on('click', null)
    this.canvas.on('mousemove', null)
    this.canvas.on('mouseout', null)
    this.xAxisNode.on('end', null)
  },
  methods: {
    click(e) {
      const context = this.canvas.node().getContext('2d')
      let hoveredId
      let x = (e.offsetX - this.transform.x) * (1 / this.transform.k)
      let y = e.offsetY * (1 / this.transform.k)

      for (let i = 0; i < this.bars.length; ++i) {
        const bar = this.bars[i]
        if (context.isPointInPath(bar.path2D, x, y)) {
          hoveredId = bar.id
          break
        }
      }

      if (!hoveredId || hoveredId !== this.hoveredId) {
        this.updateBars()
      }

      this.hoveredId = hoveredId
    },
    mousemove(e) {
      const context = this.canvas.node().getContext('2d')
      let hoveredId
      let x = (e.offsetX - this.transform.x) * (1 / this.transform.k)
      let y = e.offsetY * (1 / this.transform.k)

      for (let i = 0; i < this.bars.length; ++i) {
        const bar = this.bars[i]
        if (context.isPointInPath(bar.path2D, x, y)) {
          hoveredId = bar.id
          this.canvas._groups[0][0].style.cursor = 'pointer'
          break
        }
      }

      if ((!hoveredId && this.hoveredId) || hoveredId !== this.hoveredId) {
        if (!hoveredId) this.canvas._groups[0][0].style.cursor = null
        this.$emit('hover', hoveredId)
        this.updateBars()
      }

      this.hoveredId = hoveredId
    },
    mouseout() {
      // if we don't have a hovered item already
      // we don't need to do anything
      if (!this.hoveredId) return
      this.hoveredId = null
      this.canvas._groups[0][0].style.cursor = null
      this.updateBars()
      this.$emit('hover', null)
    },
    newXAxis(x) {
      let day
      let meridiem

      return d3
        .axisBottom(x)
        .ticks(5)
        .tickSizeOuter(0)
        .tickFormat(d => {
          const dateObj = new Date(d)
          const dayWeek = dateObj.getDay()
          const hours = dateObj.getHours() < 12 ? 'am' : 'pm'

          if (day && dayWeek === day && meridiem && hours === meridiem) {
            return formatTime(d)
          } else {
            day = dayWeek
            meridiem = hours
            return formatTimeExtended(d)
          }
        })
    },
    render(elapsed) {
      const t = Math.min(1, d3[this.easing](elapsed / this.animationDuration))

      const context = this.canvas.node().getContext('2d')
      context.save()
      context.clearRect(0, 0, this.width_, this.height_)
      context.translate(this.transform.x, 1)
      context.scale(this.transform.k, this.transform.k)

      let len = this.bars.length
      for (let i = 0; i < len; ++i) {
        context.beginPath()
        const bar = this.bars[i]

        const multiplier = bar.leaving ? t * 10 : t

        bar.alpha = this.hoveredId
          ? bar.id == this.hoveredId
            ? 1
            : 0.5
          : bar.alpha || 1
        bar.x = bar.x0 * (1 - t) + bar.x1 * multiplier
        bar.y = Math.round(bar.y0 * (1 - t) + bar.y1 * multiplier)
        bar.height = Math.round(
          bar.height0 * (1 - t) + bar.height1 * multiplier
        )
        bar.width = bar.width0 * (1 - t) + bar.width1 * multiplier
        bar.shadow = bar.shadow0 * (1 - t) + bar.shadow1 * multiplier

        this.bars[i].path2D = new Path2D()

        const radius = (bar.height / 2) * (1 / this.transform.k)
        const x = bar.x + radius / 2
        const y = bar.y * (1 / this.transform.k)

        let offset = 0
        context.globalAlpha = bar.alpha || 1

        // Create outline of the bar
        if (bar.shadow && (!this.hoveredId || this.hoveredId == bar.id)) {
          context.beginPath()
          // context.lineWidth = 1 * (1 / this.transform.k)
          // context.strokeStyle = colors[0]
          context.fillStyle = '#eee'
          context.shadowColor = '#666'
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

        bar.colors.forEach((color, j) => {
          context.beginPath()

          context.fillStyle = color.color || '#eee'

          const capLeft = new Path2D(),
            capRight = new Path2D(),
            rect = new Path2D()

          const calcWidth = (bar.width - radius * 2) * color.value
          const width = calcWidth < 0 ? 0 : calcWidth

          rect.rect(x + offset, y, width, radius * 2)

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
        if (bar.label && !this.collapsed_) {
          const savedStrokeStyle = context.fillStyle
          const fontSize = 10 * (1 / this.transform.k)
          const textY = (9 + bar.y + bar.height) * (1 / this.transform.k)

          context.font = `${fontSize}px Roboto`
          context.textAlign = 'start'
          context.fillStyle = '#999'
          context.fillText(bar.label, bar.x, textY)
          context.fillStyle = savedStrokeStyle
        }
      }

      context.restore()

      if (t === 1) {
        this.timer.stop()
        this.bars = this.bars.filter(b => !b.leaving)
      }
    },
    rawUpdateBars() {
      const height = this.collapsed_
        ? this.barRadius * 2 - this.barRadius * this.barPadding * 2
        : this.y.bandwidth()

      const calcBar = item => {
        if (this.pauseUpdates) return

        const x = item.start_time
          ? this.x(new Date(item.start_time))
          : this.x(this.now) + 20

        const calcWidth = item.end_time
          ? this.x(new Date(item.end_time)) - x
          : item.start_time
          ? this.x(this.now) - x
          : 0

        const width = calcWidth > height ? calcWidth : height

        const y = this.collapsed_
          ? this.barPadding * this.barRadius
          : this.y(item.id)

        const alpha = 1

        const barIndex = this.bars.findIndex(b => b.id == item.id)

        const label = item.label

        // If the item isn't present in the bar array
        // we instantiate a new bar...
        if (barIndex < 0) {
          this.bars.push({
            ...item,
            alpha: alpha,
            label: label,
            height0: height,
            height1: height,
            height: height,
            shadow: 0,
            shadow0: 0,
            shadow1: item.shadow ? 5 : 0,
            width0: this.barRadius,
            width1: width,
            width: this.barRadius,
            x0: x || 0,
            x1: x,
            x: x || 0,
            y0: y,
            y1: y,
            y: y || 0
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
      this.pause()
      clearTimeout(this.drawTimeout)
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

      const width = Math.floor(
        parent.clientWidth - padding.left - padding.right
      )

      // If a height is specified in the component
      // we use that, otherwise we assume infinite height and
      // let the component expand based on the min
      // bar radius
      this.height = Math.floor(
        parent.clientHeight - padding.top - padding.bottom
      )

      if (
        this.items?.length * this.minBarRadius +
          this.items?.length * this.minBarRadius * this.barPadding * 2 >
        this.height
      ) {
        this.height_ =
          this.items?.length * this.minBarRadius +
          this.items?.length * this.minBarRadius * this.barPadding * 2
      } else {
        this.height_ = this.height
      }

      if (!this.height || !width || this.height <= 0 || width <= 0) {
        return
      }

      // const axisHeight = 35

      this.svg
        .attr('viewbox', `0 0 ${width} ${this.height}`)
        .attr('width', width)
        .attr('height', this.height)

      this.canvas
        .style('width', `${width}px`)
        .style('height', `${this.height_}px`)
        .attr('width', width)
        .attr('height', this.height_)
      // .style('transform', `translate(0, ${axisHeight}px)`)

      this.xAxisNode.attr('class', 'x-axis-group').style('position', 'fixed')
      // .style('transform', `translate(0, ${height}px)`) // This moves the axis to the bottom of the svg node

      this.width_ = width

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
    updateBreakpoints(shouldTransition) {
      this.breakpointsNode.attr(
        'transform',
        () => `translate(${this.transform.x} 35) scale(${this.transform.k})`
      )

      this.breakpointsNode
        .selectAll('.breakpoints-group')
        .data(this.breakpoints_)
        .join(
          enter => {
            const g = enter
              .append('g')
              .attr(
                'transform',
                `translate(${this.x(this.now)}) scale(${1 / this.transform.k})`
              )
              .attr('class', 'breakpoints-group')

            g.append('path')
              .attr('stroke', d => d.color || '#999')
              .attr('stroke-width', 1.5)
              .attr('stroke-dasharray', 5)
              .attr('d', `M0,0L0,${this.height}`)
              .style('pointer-events', 'none')

            g.append('text')
              .style('font-size', '16px')
              .style('pointer-events', 'none')
              .attr('fill', '#999')
              .attr('text-anchor', d => d.anchor || 'middle')
              .text(d => d.label)
              .attr('y', this.height / 2)
              .attr('x', 0)
              .style('opacity', 0)
              .attr('transform', `translate(5) rotate(90 0 ${this.height / 2})`)
              .transition()
              .delay(this.animationDuration)
              .duration(150)
              .style('opacity', this.collapsed_ ? 0 : 1)

            return g.call(enter =>
              enter
                .transition('enter')
                .duration(this.animationDuration)
                .attr(
                  'transform',
                  d =>
                    `translate(${
                      d.time ? this.x(new Date(d.time)) : -20
                    }) scale(${1 / this.transform.k})`
                )
            )
          },
          update =>
            update.call(update => {
              update
                .select('path')
                .transition('update')
                .duration(this.animationDuration)
                .attr('stroke', d => d.color || '#999')
                .attr('d', `M0,0L0,${this.height}`)

              update
                .select('text')
                .attr('text-anchor', d => d.anchor || 'middle')
                .text(d => d.label)
                .transition()
                .delay(this.animationDuration)
                .duration(150)
                .style('opacity', this.collapsed_ ? 0 : 1)

              return update.call(update =>
                update
                  .transition('update')
                  .duration(shouldTransition ? this.animationDuration : 0)
                  .attr(
                    'transform',
                    d =>
                      `translate(${
                        d.time ? this.x(new Date(d.time)) : -20
                      }) scale(${1 / this.transform.k})`
                  )
              )
            }),
          exit => {
            exit
              .selectAll('text')
              .transition('exit')
              .duration(150)
              .style('opacity', 0)

            return exit.call(exit =>
              exit
                .transition('exit')
                .duration(this.animationDuration)
                .attr('transform', 'translate(0)')
                .remove()
            )
          }
        )
    },
    updateX(shouldTransition) {
      // Passing true to this method
      // removes the duration from the axis transitions
      // meaning we can keep the scales in sync with user actions
      // like zooming and panning
      const x = this.transform.rescaleX(this.x)
      const xAxis = this.newXAxis(x)
      this.now = new Date()

      this.xAxisNode
        .transition()
        .duration(shouldTransition ? this.animationDuration : 0)
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
      const prevDomainEnd = this.domainEnd

      this.now = new Date()
      const startMs = this.start?.getTime() ?? 0
      const endMs = (this.end ?? this.now).getTime()
      const domainPadding = (endMs - startMs) * 0.05 // 1 minute padding on either side
      this.domainStart = new Date(startMs - domainPadding)
      this.domainEnd = new Date(endMs + domainPadding)

      this.x.range([this.barRadius * 1.25, this.width_ - this.padding.right])
      this.x.domain([this.domainStart, this.domainEnd])
      this.y.domain(this.items.map(item => item.id))
      this.y.paddingInner(this.barPadding)
      this.y.paddingOuter(this.barPadding * 2)
      this.y.range([0, this.height_])

      const scaleExtentUpper = (endMs - startMs) / (1000 * 60)

      this.scaleExtent = [1, scaleExtentUpper < 2 ? 2 : scaleExtentUpper]

      this.translateExtent = [
        [0, 0],
        [this.width_, this.height_]
      ]

      if (prevDomainEnd && this.transform.k !== 1) {
        const translateBy = this.x(prevDomainEnd) - this.x(this.domainEnd)

        this.transform.x += translateBy

        this.canvas.call(this.zoom, this.transform)
        // this.zoom.translateBy(this.canvas, translateBy, 0)
        // this.canvas.call(this.zoom, )¿
      } else {
        this.canvas.call(this.zoom)
      }

      this.updateX(true)
    },
    zoomed({ transform }) {
      this.transform = transform
      this.updateX()
    },
    collapse() {
      this.collapsed_ = !this.collapsed_
      this.resizeChart()
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
      this.resizeChart()
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
    class="position-relative timeline-container px-8"
    style="height: 100%;"
  >
    <div
      v-if="showControls"
      class="d-flex align-middle justify-space-between position-absolute"
    >
      <div>
        <div class="d-flex my-4">
          <v-btn @click="playOrPause">
            {{ pauseUpdates ? 'Play' : 'Pause' }}
          </v-btn>

          <v-btn class="ml-12" @click="collapse">
            {{ collapsed_ ? 'Expand' : 'Collapse' }}
          </v-btn>

          <v-btn class="ml-12" @click="redraw">
            Redraw
          </v-btn>

          <div> Iterations: {{ iterations }} </div>
        </div>

        <div class="d-flex  my-4">
          <v-btn :disabled="transform.k == scaleExtent[1]" @click="zoomIn">
            +
          </v-btn>
          <v-btn
            class="ml-2"
            :disabled="transform.k == scaleExtent[0]"
            @click="zoomOut"
          >
            -
          </v-btn>

          <v-btn
            class="ml-12"
            :disabled="transform.x == translateExtent[0][0]"
            @click="panLeft"
          >
            ←
          </v-btn>
          <v-btn
            class="ml-2"
            :disabled="transform.x == -translateExtent[1][0]"
            @click="panRight"
          >
            →
          </v-btn>
        </div>
      </div>
      <div
        class="text-caption text-right d-flex flex-column justify-space-around"
      >
        <div>
          Scale:
          <div class="font-weight-medium">
            {{ Math.round(transform.k * 100) / 100 }}
          </div>
        </div>
        <hr />
        <div>
          Transform
          <div class="font-weight-medium">
            {{ Math.round(transform.x * 100) / 100 }},
            {{ Math.round(transform.y * 100) / 100 }}
          </div>
        </div>
      </div>
    </div>

    <canvas :id="`${id}-canvas`" class="canvas mx-auto" />
    <svg :id="`${id}-svg`" class="svg" />
  </div>
</template>

<style lang="scss" scoped>
.timeline-container {
  overflow: scroll;
  position: relative;
}

.svg {
  box-sizing: border-box;
  // pointer-events: none;
  position: fixed;
  // user-select: none;
  transition: all 500ms;
  z-index: 0;
}

.canvas {
  box-sizing: border-box;
  cursor: grab;
  position: absolute;
  transition: all 500ms;
  z-index: 1;
}
</style>

<style lang="scss">
// We use unscoped css here
// so that we don't need to do a post-selection
// on the axis
.x-axis-group {
  font: 16px Roboto, sans-serif;

  // .tick:first-of-type {
  //   text-anchor: start;
  // }

  // .tick:last-of-type {
  //   text-anchor: end;
  // }

  // .tick:not(:first-of-type):not(:last-of-type):nth-child(even) {
  //   opacity: 0;
  // }
}

.breakpoints-group {
  opacity: 0.6;
}
</style>
