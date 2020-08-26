<script>
import * as d3 from 'd3'
import uniqueId from 'lodash.uniqueid'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'
import moment from 'moment'
import DurationSpan from '@/components/DurationSpan'

import { formatTime } from '@/mixins/formatTimeMixin'

let resizeChartListener

// Adapted for 2D Path context from https://stackoverflow.com/a/3368118
function roundRect(path, x, y, width, height, radius, clipped) {
  if (typeof radius === 'undefined') {
    radius = 5
  }

  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius }
  } else {
    let defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 }

    for (let side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side]
    }
  }

  path.moveTo(x + radius.tl, y)
  path.lineTo(x + width - radius.tr, y)
  path.quadraticCurveTo(x + width, y, x + width, y + radius.tr)
  path.lineTo(
    x + width,
    y + height - radius.br - (clipped ? radius.br * 2.5 : 0)
  )
  path.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.br - (clipped ? radius.br * 2.5 : 0),
    y + height
  )
  path.lineTo(x + radius.bl, y + height)
  path.quadraticCurveTo(x, y + height, x, y + height - radius.bl)
  path.lineTo(x, y + radius.tl)
  path.quadraticCurveTo(x, y, x + radius.tl, y)
  path.closePath()
  return path
}

export default {
  components: {
    DurationSpan
  },
  mixins: [formatTime],
  props: {
    chartHeight: {
      type: String,
      required: false,
      default: () => '100%'
    },
    clickDisabled: {
      type: Boolean,
      required: false,
      default: false
    },
    items: {
      type: Array,
      required: false,
      default: () => []
    },

    // Bookends for the chart
    endTime: {
      type: String,
      required: false,
      default: null
    },
    startTime: {
      type: String,
      required: false,
      default: null
    },

    live: { type: Boolean, default: false },
    labelField: { type: String, default: 'name' },
    yField: { type: String, default: () => null }
  },
  data() {
    return {
      id: uniqueId('ganttChart'),
      canvas: null,
      svg: null,

      bars: [],

      // Axes functions
      x: d3.scaleTime(),
      y: d3.scaleBand(),

      // Dimensions
      height: null,
      width: null,

      // Misc
      animationDuration: 500,
      animationInterval: null,
      barMaxHeight: 35,
      barMinHeight: 10,
      barWidth: 25,
      barPaddingY: 10,
      easing: 'easePolyInOut',
      hovered: null,
      xAxisGridlinesGroup: null,
      xAxisGroup: null,
      yAxisGroup: null
    }
  },
  computed: {
    containerStyle() {
      return {
        height:
          this.items?.length * (this.barMinHeight + this.barPaddingY) + 'px',
        'min-height': 10 * (this.barMinHeight + this.barPaddingY) + 'px'
      }
    },
    hoveredId() {
      return this.hovered?.id
    },
    _mouseout: function() {
      return debounce(this._rawMouseout, 0, { trailing: true, leading: false })
    },
    render: function() {
      return throttle(this._renderCanvas, 16)
    },
    tooltipStyle() {
      if (!this.hovered) return
      const p = this.$refs['parent'].getBoundingClientRect()
      const overRight = this.hovered.offsetX + 125 - p.width > 0
      const overLeft = this.hovered.offsetX - 125 < 0
      const overBottom =
        this.hovered.y + this.hovered.height + 200 - p.height > 0
      return {
        left: `${
          overRight ? p.width - 250 : overLeft ? 0 : this.hovered.offsetX - 125
        }px`,
        'pointer-events': 'none',
        top: `${
          overBottom
            ? this.hovered.y - 200 + this.hovered.height
            : this.hovered.y + this.hovered.height + 8
        }px`,
        width: '250px',
        'z-index': 3
      }
    }
  },
  watch: {
    items: {
      deep: true,
      handler: debounce(function() {
        if (this.items?.length === 0) {
          console.info('No items were passed to the Gantt Chart component')
        }
        this.resizeChart()
        this.update()
      }, 500)
    },
    startTime() {
      if (!moment(this.startTime)._isValid) {
        /* eslint-disable-next-line */
        console.error(this.startTime)
        throw new Error('Invalid startTime', this.startTime)
      }
      this.update()
    },
    endTime() {
      if (!moment(this.endTime)._isValid) {
        /* eslint-disable-next-line */
        console.error(this.endTime)
        throw new Error('Invalid endTime', this.endTime)
      }
      this.update()
    }
  },
  mounted() {
    this.canvas = d3.select(`#${this.id}-canvas`)
    this.svg = d3.select(`#${this.id}-svg`)

    this.yAxisGroup = this.svg.append('g')
    this.xAxisGridlinesGroup = this.svg.append('g')

    this.xAxisGroup = this.svg.append('g')

    const resizeChart = this.resizeChart

    resizeChartListener = debounce(function() {
      requestAnimationFrame(resizeChart)
    }, 150)

    window.addEventListener('resize', resizeChartListener)

    requestAnimationFrame(this.resizeChart)

    this.update()
  },
  beforeDestroy() {
    window.removeEventListener('resize', resizeChartListener)
  },
  methods: {
    _click(e) {
      if (this.clickDisabled) return

      const context = this.canvas.node().getContext('2d')
      try {
        const clicked = this.bars.find(bar =>
          context?.isPointInPath(bar.path2D, e.offsetX, e.offsetY)
        )
        this.$emit('bar-click', clicked)
      } catch {
        return
      }
    },
    _mouseover(e) {
      this._mouseout.cancel()

      const context = this.canvas.node().getContext('2d')
      try {
        this.hovered = this.bars.find(bar =>
          context?.isPointInPath(bar.path2D, e.offsetX, e.offsetY)
        )
      } catch {
        return
      }
      if (this.hoveredId) {
        this.hovered.offsetX = e.offsetX
        this.hovered.offsetY = e.offsetY
      }

      this.$refs.canvas.style.cursor = this.hoveredId ? 'pointer' : null

      this.$emit('bar-mouseover', this.hovered)

      this._renderCanvas()
    },
    _rawMouseout() {
      this.$emit('bar-mouseout', this.hovered)
      this.hovered = null
      this.$refs.canvas.style.cursor = null

      this._renderCanvas()
    },
    _renderCanvas() {
      cancelAnimationFrame(this.drawCanvas)

      const height =
        this.y.bandwidth() > this.barMaxHeight
          ? this.barMaxHeight
          : this.y.bandwidth()

      const calcBar = item => {
        const x = item.start_time ? this.x(new Date(item.start_time)) : 0

        const calcWidth = item.end_time
          ? this.x(new Date(item.end_time)) - x
          : item.start_time
          ? this.x(Date.now()) - x
          : 0

        const width =
          calcWidth > 0
            ? calcWidth > this.barWidth
              ? calcWidth
              : this.barWidth
            : calcWidth

        // This indicates that the calculated width is less than the min
        // bar width, so we should display an indicator that this isn't visually representative
        const clipped = calcWidth < this.barWidth

        const y = this.y(item[this.yField]) + this.barPaddingY

        const alpha = 1

        const barIndex = this.bars.findIndex(
          b => b[this.yField] == item[this.yField]
        )

        const label = item[this.labelField]

        // We return here if there's no y since that means we don't have
        // a label for the Y axis yet
        if (!y) return

        // If the item isn't present in the bar array
        // we instantiate a new bar...
        if (barIndex < 0) {
          this.bars.push({
            ...item,
            alpha: alpha,
            clipped: clipped,
            label: label,
            height0: height,
            height1: height,
            height: height,
            width0: 0,
            width1: width,
            width: 0,
            x0: x || 0,
            x1: x,
            x: x || 0,
            y0: y || 0,
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
            clipped: clipped,
            height0: bar.height,
            height1: height,
            height: bar.height,
            width0: bar.width,
            width1: width,
            width: bar.width,
            x0: bar.x > 0 ? bar.x : x,
            x1: x,
            x: bar.x > 0 ? bar.x : x,
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
        .filter(
          bar => !this.items.find(item => item[this.yField] == bar[this.yField])
        )
        // ...otherwise we'll start the exit animation
        .forEach((bar, i) => {
          const bar1 = {
            clipped: false,
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

      requestAnimationFrame(this.drawCanvas)
      const timingCallback = elapsed => {
        const t = Math.min(1, d3[this.easing](elapsed / this.animationDuration))

        this.bars.forEach(bar => {
          const multiplier = bar.leaving ? t * 10 : t

          bar.alpha = this.hoveredId
            ? bar.id == this.hoveredId
              ? 1
              : 0.5
            : bar.alpha || 1
          bar.x = Math.round(bar.x0 * (1 - t) + bar.x1 * multiplier)
          bar.y = Math.round(bar.y0 * (1 - t) + bar.y1 * multiplier)
          bar.height = Math.round(
            bar.height0 * (1 - t) + bar.height1 * multiplier
          )
          bar.width = Math.round(bar.width0 * (1 - t) + bar.width1 * multiplier)
        })

        requestAnimationFrame(this.drawCanvas)

        if (t === 1) {
          this.timer.stop()
          this.bars = this.bars.filter(b => !b.leaving)
        }
      }

      if (this.timer) {
        this.timer.restart(timingCallback)
      } else {
        this.timer = d3.timer(timingCallback)
      }
    },
    drawCanvas() {
      const context = this.canvas.node().getContext('2d')

      context.lineWidth = 2
      context.font = 'Roboto'
      context.strokeStyle = '#f9f9f9'

      context.clearRect(0, 0, this.width, this.height)

      let len

      len = this.bars.length
      for (let i = 0; i < len; ++i) {
        const bar = this.bars[i]
        this.bars[i].path2D = new Path2D()

        context.globalAlpha = bar.alpha

        context.fillStyle = bar.color || '#eee'

        roundRect(
          this.bars[i].path2D,
          bar.x,
          bar.y,
          bar.width,
          bar.height,
          3,
          bar.clipped
        )

        if (!bar.outlined) {
          context.fill(this.bars[i].path2D)
          context.strokeStyle = '#fff'
        } else {
          context.strokeStyle = bar.color
        }

        if (bar.shadow) {
          context.strokeStyle = '#777'
        }

        context.stroke(this.bars[i].path2D)

        if (bar.label) {
          const savedStrokeStyle = context.fillStyle
          context.font = `${
            bar.height > this.barMinHeight ? this.barMinHeight : bar.height / 2
          }px Roboto`
          context.fillStyle = '#273746'
          context.textBaseline = 'middle'
          context.fillText(bar.label, bar.x + 2, bar.y + bar.height / 2)
          context.fillStyle = savedStrokeStyle
        }
      }
    },
    resizeChart() {
      let parent = this.svg.select(function() {
        return this.parentNode
      })

      const marginY = 24

      let computedStyle = window.getComputedStyle(parent._groups[0][0], null)

      let paddingLeft = parseFloat(
          computedStyle.getPropertyValue('padding-left')
        ),
        paddingRight = parseFloat(
          computedStyle.getPropertyValue('padding-right')
        ),
        paddingTop = parseFloat(computedStyle.getPropertyValue('padding-top')),
        paddingBottom = parseFloat(
          computedStyle.getPropertyValue('padding-bottom')
        )

      const height =
        parent._groups[0][0].clientHeight - paddingTop - paddingBottom
      const width =
        parent._groups[0][0].clientWidth - paddingLeft - paddingRight

      if (!height || !width || height < 0 || width < 0) {
        return
      }

      this.svg
        .attr('viewbox', `0 0 ${width} ${height}`)
        .attr('width', width)
        .attr('height', height)

      this.height = height
      this.width = width
      this.canvasHeight = height - marginY

      this.canvas.attr('width', this.width).attr('height', this.canvasHeight)

      this.update()
    },
    updateX() {
      if (!this.startTime) return

      clearInterval(this.animationInterval)

      const startTime = new Date(this.startTime)
      const endTime = this.endTime
        ? new Date(this.endTime)
        : Date.now().toString()

      this.x.domain([startTime, endTime])
      this.x.range([25, this.width - 50])

      if (this.live) {
        this.animationInterval = setInterval(() => {
          const t = Date.now().toString()
          this.x.domain([startTime, t])

          this.drawXAxis()
          this.render()

          if (!this.live) {
            clearInterval(this.animationInterval)
          }
        }, this.animationDuration)
      } else {
        this.x.domain([startTime, endTime])
        this.drawXAxis()
      }
    },
    updateY() {
      this.y.paddingOuter(0.1)
      this.y.domain(this.items.map(item => item[this.yField]))
      this.y.range([0, this.canvasHeight])
    },
    update() {
      this.updateY()
      this.updateX()
      this.render()
    },
    async drawXAxis() {
      let day
      let meridiem

      const formatTime = d3.timeFormat('%-I:%M:%S')
      const formatTimeExtended = d3.timeFormat('%a %-I:%M:%S %p')

      const xAxis = d3.axisTop(this.x.nice()).tickFormat(d => {
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

      const xAxisGrid = d3
        .axisTop(this.x.nice())
        .tickSize(-this.height)
        .tickFormat('')

      await this.xAxisGridlinesGroup
        .attr('class', 'x-axis-gridlines-group')
        .style('color', '#eee')
        .attr('transform', `translate(0, ${-25})`)
        .transition()
        .duration(this.animationDuration)
        .call(xAxisGrid)

      this.xAxisGridlinesGroup.selectAll('path').remove()
      this.xAxisGridlinesGroup.selectAll('.tick:first-of-type').remove()
      this.xAxisGridlinesGroup.selectAll('.tick:last-of-type').remove()

      await this.xAxisGroup
        .attr('class', 'x-axis-group')
        .attr('transform', `translate(0, ${this.height - 2})`)
        .style('font-family', 'monospace')
        .transition()
        .duration(this.animationDuration)
        .call(xAxis)

      this.xAxisGroup
        .selectAll('line')
        .filter((d, i) => i % 2 !== 0)
        .style('color', '#eee')
        .style('y2', -25)

      this.xAxisGroup
        .selectAll('text')
        .style('opacity', (d, i) => (i % 2 === 0 ? 1 : 0))
        .attr('text-anchor', (d, i, arr) => {
          return i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'
        })
    },
    async drawYAxis() {
      const yAxis = d3.axisRight(this.y)

      await this.yAxisGroup
        .attr('class', 'y-axis-group')
        .style('opacity', 0)
        .transition()
        .duration(this.animationDuration)
        .call(yAxis)
    },
    statusStyle(state) {
      return {
        'border-radius': '50%',
        display: 'inline-block',
        'background-color': `var(--v-${state}-base)`,
        height: '0.75rem',
        width: '0.75rem'
      }
    }
  }
}
</script>

<template>
  <v-container :style="containerStyle" fluid>
    <div
      ref="parent"
      class="position-relative chart-container"
      style="height: 100%;"
    >
      <canvas
        :id="`${id}-canvas`"
        ref="canvas"
        class="gantt"
        @mousemove="_mouseover"
        @mouseout="_mouseout"
        @click="_click"
      />
      <svg :id="`${id}-svg`" class="gantt" />

      <v-fade-transition mode="out-in">
        <div
          v-if="$slots['tooltip']"
          class="v-tooltip__content barchart-tooltip"
          :style="tooltipStyle"
        >
          <slot name="tooltip" />
        </div>

        <v-card
          v-else-if="hoveredId"
          :style="tooltipStyle"
          tile
          class="tooltip-style"
        >
          <v-card-title
            :style="{ color: `var(--v-${hovered.state}-base)` }"
            class="text-subtitle-1"
          >
            <div>
              {{ hovered[labelField] }}
              <div class="caption grey--text text--lighten-1">
                (Click to expand)
              </div>
            </div>
          </v-card-title>
          <v-card-text>
            <div class="d-flex align-end justify-space-between">
              State:
              <div>
                <span :style="statusStyle(hovered.state)"></span>
                <span class="font-weight-bold"> {{ hovered.state }}</span>
              </div>
            </div>
            <div
              v-if="hovered.start_time"
              class="subtitle d-flex align-end justify-space-between"
            >
              Duration:

              <DurationSpan
                class="font-weight-bold"
                :start-time="hovered.start_time"
                :end-time="hovered.end_time"
              />
            </div>

            <div
              v-if="hovered.start_time"
              class="subtitle d-flex align-end justify-space-between"
            >
              Start:

              <span class="font-weight-bold">
                {{ formatTimeGranular(hovered.start_time) }}
              </span>
            </div>

            <div
              v-if="hovered.end_time"
              class="subtitle d-flex align-end justify-space-between"
            >
              End:

              <span class="font-weight-bold">
                {{ formatTimeGranular(hovered.end_time) }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-fade-transition>
    </div>
  </v-container>
</template>

<style lang="scss" scoped>
.gantt {
  left: 0;
  position: absolute;
  top: 0;
}

canvas {
  // cursor: grab;
  z-index: 3;

  // &:active {
  //   cursor: grabbing;
  // }
}

svg {
  z-index: 2;
}

.tooltip-style {
  transition: all 50ms;
}
</style>
