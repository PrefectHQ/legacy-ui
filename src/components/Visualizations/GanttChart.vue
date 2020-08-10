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
    }
  },
  data() {
    return {
      id: uniqueId('ganttChart'),
      canvas: null,
      svg: null,

      // Axes functions
      x: null,
      y: null,

      // Dimensions
      height: null,
      width: null,

      // Misc
      animationDuration: 500
    }
  },
  computed: {
    containerStyle() {
      return {
        height: this.groups?.length * 100 + 'px'
      }
    },
    render: function() {
      return throttle(this._renderCanvas, 16)
    }
  },
  watch: {
    groups: {
      deep: true,
      handler: debounce(function() {
        this.update()
      }, 500)
    },
    items: {
      deep: true,
      handler: debounce(function() {
        this.update()
      }, 500)
    }
  },
  mounted() {
    console.log(this.groups)
    console.log(this.items)

    this.canvas = d3.select(`#${this.id}-canvas`)
    this.svg = d3.select(`#${this.id}-svg`)

    this.y = d3.scaleBand()
    this.x = d3.scaleTime()

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
    _renderCanvas() {},
    resizeChart() {
      let parent = this.svg.select(function() {
        return this.parentNode
      })

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

      this.height =
        parent._groups[0][0].clientHeight - paddingTop - paddingBottom
      this.width = parent._groups[0][0].clientWidth - paddingLeft - paddingRight

      if (!this.height || !this.width || this.height < 0 || this.width < 0) {
        return
      }

      this.svg
        .attr('viewbox', `0 0 ${this.width} ${this.height}`)
        .attr('width', this.width)
        .attr('height', this.height)

      this.canvas
        .attr('width', this.width)
        .attr('height', this.height)
        .style('width', this.width)
        .style('height', this.height)

      this.update()
    },
    update() {
      console.log('updating')

      this.y.domain(this.groups.map(group => group.id))
      this.y.range([0, this.height])

      const startTime = moment(this.startTime)
      const endTime = moment(this.endTime)

      console.log(startTime, endTime)
      this.x.domain([startTime, endTime])
      this.x.range([0, this.width])

      const yAxis = d3.axisRight(this.y)
      const xAxis = d3.axisTop(this.x)

      this.yAxisGroup
        .attr('class', 'y-axis-group')
        .style('opacity', 0)
        .transition()
        .duration(this.animationDuration)
        .call(yAxis)

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
      class="d-flex justify-space-around flex-column text-right"
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
      <canvas :id="`${id}-canvas`" class="gantt" />
      <svg :id="`${id}-svg`" class="gantt" />
    </div>
  </v-container>
</template>

<style lang="scss" scoped>
.gantt {
  left: 0;
  position: absolute;
  top: 0;

  canvas {
    z-index: 1;
  }

  svg {
    z-index: 2;
  }
}
</style>
