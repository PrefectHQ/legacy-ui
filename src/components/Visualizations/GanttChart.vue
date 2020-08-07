<script>
import * as d3 from 'd3'
import uniqueId from 'lodash.uniqueid'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'

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
      width: null
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
    },
    update() {
      this.y = d3
        .scaleOrdinal()
        .domain(this.groups.map(group => group.id))
        .range([0, this.height])
    }
  }
}
</script>

<template>
  <v-container :style="containerStyle">
    <canvas :id="`${id}-canvas`" />
    <svg :id="`${id}-svg`" />
  </v-container>
</template>
