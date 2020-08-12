<script>
import * as d3 from 'd3'
import uniqueId from 'lodash.uniqueid'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'
import moment from 'moment'

let resizeChartListener

export default {
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
    containerStyle() {
      return {
        height: this.groups?.length * 100 + 'px'
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
      let p = this.$refs['parent'].getBoundingClientRect()
      let overRight = this.hovered.x + 150 - p.width > 0
      let overLeft = this.hovered.x - 150 < 0
      return {
        left: `${
          overRight ? p.width - 150 : overLeft ? 150 : this.hovered.x
        }px`,
        top: `${this.hovered.y}px`
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
    _mouseover(d) {
      console.log(d)
      this._mouseout.cancel()
      // this.hovered = {
      //   data: d,
      //   x: this.x(d.id),
      //   y: this.chartHeight,
      //   width: this.x.bandwidth(),
      //   height: this.calcHeight(d)
      // }
      this.$emit('bar-mouseover', this.hovered)

      this._renderCanvas()
    },
    _rawMouseout() {
      this.$emit('bar-mouseout', this.hovered)
      this.hovered = null

      this._renderCanvas()
    },
    _renderCanvas() {
      cancelAnimationFrame(this.drawCanvas)

      const now = new moment()

      const bandWidthHeight = this.y.bandwidth()

      // const

      // Check our current data against existing bars
      this.items.forEach(item => {
        const startTime = moment(item.start_time)
        const endTime = moment(item.end_time)

        const width1 = item.start_time ? this.x(endTime || now) : 0
        const x1 = item.start_time ? this.x(startTime || now) : this.width
        const y1 = this.y(item[this.yField])

        const barIndex = this.bars.findIndex(b => b.id == item.id)
        // If the item isn't present in the bar array
        // we instantiate a new bar...
        if (barIndex < 0) {
          this.bars.push({
            ...item,
            height0: bandWidthHeight,
            height1: bandWidthHeight,
            height: bandWidthHeight,
            width0: 0,
            width1: width1,
            width: 0,
            x0: x1 || 0,
            x1: x1 || 0,
            x: x1 || 0,
            y0: y1,
            y1: y1,
            y: y1
          })
        } else {
          // ...otherwise we update the existing bar with
          // new values
          const bar = this.bars[barIndex]
          const bar1 = {
            ...item,
            height0: bar.height,
            height1: bandWidthHeight,
            height: bar.height,
            width0: bar.width,
            width1: width1,
            width: bar.width,
            x0: bar.x,
            x1: x1 || 0,
            x: bar.x,
            y0: bar.y,
            y1: y1,
            y: bar.y
          }

          this.bars[barIndex] = { ...bar, ...bar1, ...item }
        }
      })

      // Check our existing bars against current data
      this.bars.forEach((bar, i) => {
        const itemExists = this.items.find(item => item.id == bar.id)

        // If this is a valid bar, do nothing since its data was already
        // updated in the loop above...
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
            : bar.opacity || 1
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

        context.beginPath()
        context.globalAlpha = bar.alpha
        context.fillStyle = bar.color || '#eee'

        context.rect(bar.x, bar.y, bar.width, bar.height)
        context.fill()
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
      console.log('drawingx')
      const xAxis = d3.axisTop(this.x).ticks(30)

      this.xAxisGroup
        .attr('class', 'x-axis-group')
        .attr('transform', `translate(0, ${this.height - 1})`)
        .transition()
        .duration(this.animationDuration)
        .call(xAxis)
    }
  }
}
</script>

<template>
  <v-container :style="containerStyle" class="d-flex align-start justify-start">
    <div
      class="d-flex justify-space-around flex-column text-right pb-6"
      style="height: 100%;"
    >
      <div v-for="group in groups" :key="group.id" class="caption">
        {{ group.name }}
      </div>
    </div>

    <div
      class="position-relative flex-grow-1 flex-shrink-0"
      style="height: 100%;"
    >
      <canvas :id="`${id}-canvas`" class="gantt" @click="_mouseover" />
      <svg :id="`${id}-svg`" class="gantt" />
    </div>

    <transition name="tooltip-fade" mode="in-out">
      <div
        v-if="$slots['tooltip']"
        class="v-tooltip__content barchart-tooltip"
        :style="tooltipStyle"
      >
        <slot name="tooltip" />
      </div>
    </transition>
  </v-container>
</template>

<style lang="scss" scoped>
.gantt {
  left: 0;
  position: absolute;
  top: 0;
}

canvas {
  z-index: 3;
}

svg {
  z-index: 2;
}
</style>
