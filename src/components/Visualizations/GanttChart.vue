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

    groups: {
      type: Array,
      required: false,
      default: () => []
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
      barHeight: 25,
      barWidth: 25,
      barPaddingY: 5,
      containerStyle: {
        height: this.chartHeight
      },
      easing: 'easeLinear',
      hovered: null
    }
  },
  computed: {
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
    groups: {
      deep: true,
      handler: debounce(function() {
        this.updateY()
      }, 1000)
    },
    items: {
      deep: true,
      handler: debounce(function() {
        this.updateX()
      }, 1000)
    },
    startTime() {
      this.updateX()
    },
    endTime() {
      this.updateX()
    }
  },
  mounted() {
    this.canvas = d3.select(`#${this.id}-canvas`)
    this.svg = d3.select(`#${this.id}-svg`)

    this.yAxisGroup = this.svg.append('g')
    this.xAxisGroup = this.svg.append('g')

    const resizeChart = this.resizeChart

    resizeChartListener = debounce(function() {
      requestAnimationFrame(resizeChart)
    }, 150)

    window.addEventListener('resize', resizeChartListener)

    requestAnimationFrame(this.resizeChart)

    this.updateY()
    this.updateX()
  },
  beforeDestroy() {
    window.removeEventListener('resize', resizeChartListener)
  },
  methods: {
    _click(e) {
      if (this.clickDisabled) return

      const context = this.canvas.node().getContext('2d')

      const clicked = this.bars.find(bar =>
        context?.isPointInPath(bar.path2D, e.offsetX, e.offsetY)
      )

      this.$emit('bar-click', clicked)
    },
    _mouseover(e) {
      this._mouseout.cancel()

      const context = this.canvas.node().getContext('2d')

      this.hovered = this.bars.find(bar =>
        context?.isPointInPath(bar.path2D, e.offsetX, e.offsetY)
      )

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

      const height = this.barHeight

      const calcBar = item => {
        const x = item.start_time ? this.x(moment(item.start_time)) : 0

        const calcWidth = item.end_time
          ? this.x(moment(item.end_time)) - x
          : item.start_time
          ? this.width - x
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

        const y = this.y(item[this.yField]) + (this.y.bandwidth() - height) / 2

        const alpha = 1

        const barIndex = this.bars.findIndex(b => b.id == item.id)

        // If the item isn't present in the bar array
        // we instantiate a new bar...
        if (barIndex < 0) {
          this.bars.push({
            ...item,
            alpha: alpha,
            clipped: clipped,
            height0: height,
            height1: height,
            height: height,
            width0: 0,
            width1: width,
            width: 0,
            x0: x || 0,
            x1: x || 0,
            x: x || 0,
            y0: y || 0,
            y1: y || 0,
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
            x0: bar.x > 0 ? bar.x : x || 0,
            x1: x || 0,
            x: bar.x > 0 ? bar.x : x || 0,
            y0: y,
            y1: y,
            y: y
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

      this.groups.forEach((group, i) => {
        const y = this.y(group[this.yField]) + this.y.bandwidth() / 2

        this.groups[i].y0 = y
        this.groups[i].y1 = y
        this.groups[i].y = y
      })

      requestAnimationFrame(this.drawCanvas)
      const timingCallback = elapsed => {
        const t = Math.min(1, d3[this.easing](elapsed / this.animationDuration))

        this.bars.forEach(bar => {
          bar.alpha = this.hoveredId
            ? bar.id == this.hoveredId
              ? 1
              : 0.5
            : bar.alpha || 1
          bar.x = bar.x0 * (1 - t) + bar.x1 * t
          bar.y = bar.y0 * (1 - t) + bar.y1 * t
          bar.height = bar.height0 * (1 - t) + bar.height1 * t
          bar.width = bar.width0 * (1 - t) + bar.width1 * t
        })

        this.groups.forEach(group => {
          group.y = group.y0 * (1 - t) + group.y1 * t
          group.color =
            this.hoveredId && this.hoveredId !== group[this.yField]
              ? '#eee'
              : '#2C3E50'
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
    calcGroupLabelStyle(group) {
      const top =
        this.y(group[this.yField]) + (this.y.bandwidth() - this.barHeight) / 2
      return {
        top: `${top}px`,
        opacity:
          this.hoveredId && this.hoveredId !== group[this.yField] ? 0.3 : 1
      }
    },
    drawCanvas() {
      const context = this.canvas.node().getContext('2d')

      context.save()
      context.lineWidth = 2
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

        context.stroke(this.bars[i].path2D)
      }

      context.globalAlpha = 1
      context.font = 'Roboto'

      len = this.groups.length
      for (let i = 0; i < len; ++i) {
        const group = this.groups[i]
        context.fillStyle = group.color
        context.fillText(group.name, group.x || 0, group.y)
      }

      context.restore()
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

      this.updateY()
      this.updateX()
    },
    itemName(id) {
      return this.groups.find(group => group.id == id)?.name
    },
    async updateX() {
      clearInterval(this.animationInterval)

      const startTime = moment(this.startTime)
      const endTime = this.endTime ? moment(this.endTime) : new moment()

      this.x.domain([startTime, endTime])
      this.x.range([0, this.width - 5])

      if (this.live) {
        this.animationInterval = setInterval(() => {
          const t = new moment()
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
        this.render()
      }
    },
    async updateY() {
      this.y.paddingInner(this.barPaddingY).paddingOuter(this.barPaddingY)

      this.y.domain(this.groups.map(group => group.id))
      this.y.range([0, this.canvasHeight])
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

      await this.xAxisGroup
        .attr('class', 'x-axis-group')
        .attr('transform', `translate(0, ${this.height - 2})`)
        .style('font-family', 'monospace')
        .transition()
        .duration(this.animationDuration)
        .call(xAxis)

      this.xAxisGroup.selectAll('text').attr('text-anchor', (d, i, arr) => {
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
    <div ref="parent" class="position-relative" style="height: 100%;">
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
              {{ itemName(hovered[yField]) }}
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
