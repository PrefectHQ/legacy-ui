<script>
import * as d3 from 'd3'
import uniqueId from 'lodash.uniqueid'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'
import moment from 'moment'
import DurationSpan from '@/components/DurationSpan'

import { formatTime } from '@/mixins/formatTimeMixin'

let resizeChartListener

export default {
  components: {
    DurationSpan
  },
  mixins: [formatTime],
  props: {
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
      x: null,
      y: null,

      // Dimensions
      height: null,
      width: null,

      // Misc
      animationDuration: 500,
      easing: 'easeCubic',
      hovered: null
    }
  },
  computed: {
    barMap() {
      const barMap = {}

      this.items.forEach(item => {
        const ref = item[this.yField]
        if (ref in barMap) {
          if (
            !barMap[ref].start_time ||
            (item.start_time &&
              moment(item.start_time).isBefore(barMap[ref].start_time))
          ) {
            barMap[ref].start_time = item.start_time
          }

          if (
            !barMap[ref].end_time ||
            (item.end_time &&
              moment(item.end_time).isAfter(barMap[ref].end_time))
          ) {
            barMap[ref].end_time = item.end_time
          }

          barMap[ref].items.push(item)
        } else {
          console.log(item.map_index, item.start_time)

          barMap[ref] = {
            ref: ref,
            items: [item],
            start_time: item.start_time,
            end_time: item.end_time
          }
        }
      })

      return barMap
    },
    containerStyle() {
      return {
        height: this.groups?.length * 50 + 'px',
        'min-height': '1000px'
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
            ? this.hovered.y - 200
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
        this.update()
      }, 1000)
    },
    items: {
      deep: true,
      handler: debounce(function() {
        this.update()
      }, 1000)
    }
  },
  mounted() {
    console.log(this.groups)
    console.log(this.items)

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
  },
  beforeDestroy() {
    window.removeEventListener('resize', resizeChartListener)
  },
  methods: {
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
      console.log(this.barMap)
      cancelAnimationFrame(this.drawCanvas)

      const now = new moment()

      const bandWidthHeight = this.y.bandwidth()
      const calcBar = (item, i, array, ref) => {
        const mapped = item.state === 'Mapped'

        const startTime = mapped
          ? moment(this.barMap[ref]?.start_time)
          : moment(item.start_time)

        const endTime = mapped
          ? moment(this.barMap[ref]?.end_time)
          : moment(item.end_time)

        const x = startTime ? this.x(startTime) : 0
        const width = this.x(endTime || now) - x

        const calcY = this.y(item[this.yField])
        const height =
          mapped || item.map_index === -1
            ? bandWidthHeight
            : (1 / (array.length - 1)) * bandWidthHeight
        const y =
          mapped || item.map_index === -1
            ? calcY
            : calcY + height * item.map_index

        const alpha = mapped && 0.25

        const barIndex = this.bars.findIndex(b => b.id == item.id)

        // If the item isn't present in the bar array
        // we instantiate a new bar...
        if (barIndex < 0) {
          if (item.state == 'Mapped') {
            console.log(x, y)
          }
          this.bars.push({
            ...item,
            alpha: alpha,
            height0: height,
            height1: height,
            height: height,
            width0: 0,
            width1: width,
            width: 0,
            x0: x || 0,
            x1: x || 0,
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
            width0: bar.width,
            width1: width,
            width: bar.width,
            x0: bar.x,
            x1: x || 0,
            x: bar.x,
            y0: bar.y,
            y1: y,
            y: bar.y
          }

          this.bars[barIndex] = { ...bar, ...bar1, ...item }
        }
      }

      Object.keys(this.barMap).map(id => {
        return this.barMap[id].items.map((item, i, array) =>
          calcBar(item, i, array, id)
        )
      })

      // Check our existing bars against current data
      this.bars.forEach((bar, i) => {
        const itemExists = this.items.find(item => item.id == bar.id)

        // If this is a valid bar, do nothing since its data was already
        // updated
        if (itemExists) return

        // ...otherwise we'll start the exit animation
        const bar1 = {
          height0: bar.height,
          height1: bandWidthHeight,
          height: bar.height,
          width0: bar.width,
          width1: 0,
          width: bar.width,
          x0: bar.x,
          x1: 0,
          x: bar.x,
          y0: bar.y,
          y1: 0,
          y: bar.y,
          leaving: true
        }

        this.bars[i] = { ...bar, ...bar1 }
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
    calcBar() {},
    drawCanvas() {
      const context = this.canvas.node().getContext('2d')

      context.save()
      context.lineWidth = 2
      context.strokeStyle = '#f9f9f9'

      context.clearRect(0, 0, this.width, this.height)

      let len = this.bars.length
      for (let i = 0; i < len; ++i) {
        const bar = this.bars[i]
        this.bars[i].path2D = new Path2D()

        context.beginPath()
        context.globalAlpha = bar.alpha
        context.fillStyle = bar.color || '#eee'

        this.bars[i].path2D.rect(bar.x, bar.y, bar.width, bar.height)

        context.fill(this.bars[i].path2D)
        context.stroke()
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

      this.update()
    },
    update() {
      const y = d3.scaleBand()
      const x = d3.scaleTime()

      y.domain(this.groups.map(group => group.id))
      y.range([0, this.canvasHeight])

      const startTime = moment(this.startTime)
      const endTime = moment(this.endTime)
      const now = new moment()
      x.domain([startTime, endTime || now])
      x.range([0, this.width])

      this.y = y
      this.x = x

      if (this.live) {
        this.startXScale(startTime)
      } else {
        this.drawXAxis()
      }

      const yAxis = d3.axisRight(this.y)

      this.yAxisGroup
        .attr('class', 'y-axis-group')
        .style('opacity', 0)
        .transition()
        .duration(this.animationDuration)
        .call(yAxis)

      this.render()
    },
    startXScale(start) {
      const t = Date.now()
      this.x.domain([start, t])
      this.drawXAxis()
    },
    drawXAxis() {
      const xAxis = d3.axisTop(this.x).ticks(30)

      this.xAxisGroup
        .attr('class', 'x-axis-group')
        .attr('transform', `translate(0, ${this.height - 1})`)
        .transition()
        .duration(this.animationDuration)
        .call(xAxis)
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
  <v-container
    :style="containerStyle"
    class="d-flex align-start justify-start"
    fluid
  >
    <div
      class="d-flex justify-space-around flex-column text-right pb-6"
      style="
        height: 100%;
        width: 15%;"
    >
      <div v-for="group in groups" :key="group.id" class="caption">
        {{ group.name }}
      </div>
    </div>

    <div
      ref="parent"
      class="position-relative"
      style="
        height: 100%;
        width: 85%;"
    >
      <canvas
        :id="`${id}-canvas`"
        ref="canvas"
        class="gantt"
        @mousemove="_mouseover"
        @mouseout="_mouseout"
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

        <v-card v-else-if="hoveredId" :style="tooltipStyle" tile>
          <v-card-title
            :style="{ color: `var(--v-${hovered.state}-base)` }"
            class="text-subtitle-1"
          >
            <div>
              {{ hovered.task_id
              }}{{ hovered.map_index > -1 ? `(${hovered.map_index})` : '' }}
              <div class="caption grey--text text--lighten-1">
                (Click for more details)
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
                :end-time="
                  hovered.end_time
                    ? hovered.end_time
                    : barMap[hovered.task_id].end_time
                "
              />
            </div>

            <div
              v-if="hovered.start_time || barMap[hovered.task_id].start_time"
              class="subtitle d-flex align-end justify-space-between"
            >
              Start:

              <span class="font-weight-bold">
                {{
                  formatTimeGranular(
                    hovered.start_time || barMap[hovered.task_id].start_time
                  )
                }}
              </span>
            </div>

            <div
              v-if="hovered.end_time || barMap[hovered.task_id].end_time"
              class="subtitle d-flex align-end justify-space-between"
            >
              End:

              <span class="font-weight-bold">
                {{
                  formatTimeGranular(
                    hovered.end_time || barMap[hovered.task_id].end_time
                  )
                }}
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
  cursor: grab;
  z-index: 3;

  &:active {
    cursor: grabbing;
  }
}

svg {
  z-index: 2;
}
</style>
