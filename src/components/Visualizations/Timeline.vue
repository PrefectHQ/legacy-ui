<script>
import * as d3 from 'd3'
import uniqueId from 'lodash.uniqueid'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'

throttle

export default {
  props: {
    collapsed: {
      type: Boolean,
      required: false,
      default: false
    },
    height: {
      type: Number,
      required: false,
      default: null
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
  data: () => ({
    id: uniqueId('timeline'),
    canvas: null,
    svg: null,

    height_: null,
    width_: null,

    interval: null,
    iterations: 0,
    playing: false
  }),
  computed: {
    resizeChart: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawResizeChart)
      }, 300)
    }
  },
  mounted() {
    this.canvas = d3.select(`#${this.id}-canvas`)
    this.svg = d3.select(`#${this.id}-svg`)

    window.addEventListener('resize', this.resizeChart)
    requestAnimationFrame(this.resizeChart)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart)
  },
  methods: {
    play() {
      this.playing = true
      this.interval = setInterval(() => {
        ++this.iterations
      }, 16)
    },
    playOrPause() {
      this.playing ? this.pause() : this.play()
    },
    pause() {
      this.playing = false
      clearInterval(this.interval)
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

      const width = parent.clientWidth - padding.left - padding.right

      const height = parent.clientHeight - padding.top - padding.bottom

      if (!height || !width || height <= 0 || width <= 0) {
        return
      }

      this.svg
        .attr('viewbox', `0 0 ${width} ${height}`)
        .attr('width', width)
        .attr('height', height)

      this.canvas.attr('width', width).attr('height', height)

      this.height_ = height
      this.width_ = width
    }
  }
}
</script>

<template>
  <div ref="parent" class="position-relative">
    <div>
      <v-btn @click="playOrPause">{{ playing ? 'Pause' : 'Play' }}</v-btn>
      <div>Number of iterations: {{ iterations }}</div>
    </div>
    <canvas :id="`${id}-canvas`" />
    <svg :id="`${id}-svg`" />
  </div>
</template>

<style lang="scss" scoped>
.svg {
  height: 100%;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  user-select: none;
  z-index: 0;
}

.canvas {
  cursor: grab;
  position: relative;
  z-index: 1;
}
</style>
