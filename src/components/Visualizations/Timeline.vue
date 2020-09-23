<script>
/* eslint-disable */
import * as d3 from 'd3'
import { axisBottom } from '@d3fc/d3fc-axis'
import uniqueId from 'lodash.uniqueid'
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'

throttle
const formatTime = d3.timeFormat('%-I:%M:%S')
const formatTimeExtended = d3.timeFormat('%a %-I:%M:%S %p')

const opacity = (d, i, arr) => {
  return i === 0 || i === arr.length - 1 ? 1 : i % 2 === 0 ? 1 : 0
}

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
    animationDuration: 500,
    id: uniqueId('timeline'),
    canvas: null,
    now: Date.now(),
    svg: null,
    zoom: d3.zoom(),

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
    playing: false,
    scaleExtent: [1, 10],
    translateExtent: [
      [-Infinity, -Infinity],
      [Infinity, Infinity]
    ],
    transform: { x: 0, y: 0, k: 1 },

    // Scales
    x: d3.scaleTime(),
    y: d3.scaleBand(),
    xAxis: null,
    xAxisNode: null
  }),
  computed: {
    resizeChart: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawResizeChart)
      }, 300)
    },

    // Computed X Domain
    // startTimeMs() {
    //   return new Date(this.startTime).getTime()
    // },
    // endTimeMs() {
    //   if (!this.endTime) return null
    //   return new Date(this.endTime).getTime()
    // },

    start() {
      if (!this.startTime) return this.now
      return new Date(this.startTime)
    },
    end() {
      if (!this.endTime) return null
      return new Date(this.endTime)
    }
  },
  mounted() {
    this.canvas = d3.select(`#${this.id}-canvas`)
    this.svg = d3.select(`#${this.id}-svg`)

    this.xAxisNode = this.svg.append('g')

    window.addEventListener('resize', this.resizeChart)
    requestAnimationFrame(this.resizeChart)
  },
  beforeDestroy() {
    this.interval?.stop()
    window.removeEventListener('resize', this.resizeChart)
    this.canvas.on('.zoom', null)
    this.xAxisNode.on('end', null)
  },
  methods: {
    newXAxis(x) {
      let day
      let meridiem

      return axisBottom(x).tickFormat(d => {
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
    play() {
      this.playing = true
      this.interval = d3.interval(() => {
        // this.updateX()
        ++this.iterations
      }, this.animationDuration)
    },
    playOrPause() {
      this.playing ? this.pause() : this.play()
    },
    pause() {
      this.playing = false
      this.interval?.stop()
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

      this.xAxisNode
        .attr('class', 'x-axis-group')
        .attr('transform', `translate(0, ${height})`)

      this.x.range([this.padding.left, width - this.padding.right])

      this.height_ = height
      this.width_ = width

      const now = new Date()

      const domainStart = this.start
      const domainEnd = this.end ?? now

      this.x.domain([domainStart, domainEnd])

      const xAxis = this.newXAxis(this.x)

      this.xAxisNode
        // .transition()
        // .duration(50 || this.animationDuration)
        // .ease(d3.easeLinear)
        .call(xAxis)

      this.scaleExtent = [
        1,
        (domainEnd.getTime() - domainStart.getTime()) / (1000 * 60)
      ]

      this.translateExtent = [
        [0, 0],
        [this.width_, this.height_]
      ]

      this.zoom = d3
        .zoom()
        .scaleExtent(this.scaleExtent)
        .translateExtent(this.translateExtent)
        .on('zoom', ({ transform }) => {
          console.log(transform)
          this.updateX(transform)
        })

      this.canvas.call(this.zoom)

      this.updateX(d3.zoomIdentity)
    },
    updateX(transform) {
      console.log('updating x', transform)
      this.transform = transform

      const xAxis = this.newXAxis(this.transform.rescaleX(this.x))

      this.xAxisNode
        // .transition()
        // .duration(50 || this.animationDuration)
        // .ease(d3.easeLinear)
        // .transition()
        // .delay(0)
        .call(xAxis)
      // .call(node => {
      //   node
      //     .selectAll('text')
      //     // .style('opacity', opacity)
      //     .attr('text-anchor', (d, i, arr) => {
      //       return i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'
      //     })
      // })

      // this.x.domain([
      //   this.start ? this.start : new Date(now - 60000),
      //   this.end ? this.end : now

      // .extent([0, 0], [this.width_, this.height_])

      // const xAxis = this.newXAxis(this.transform?.rescaleX(this.x) ?? this.x)

      // this.xAxisNode
      //   .transition()
      //   .duration(this.animationDuration)
      //   .ease(d3.easeLinear)
      //   .call(xAxis)
      // .call(node => {
      //   node
      //     .selectAll('text')
      //     // .style('opacity', opacity)
      //     .attr('text-anchor', (d, i, arr) => {
      //       return i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'
      //     })
      // })

      // .on('end', this.updateX)
    },
    zoomed(e) {
      this.transform = e.transform
      this.updateX()
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
  <div ref="parent" class="position-relative">
    <div>
      <v-btn @click="playOrPause">{{ playing ? 'Pause' : 'Play' }}</v-btn>
      <div>Number of iterations: {{ iterations }}</div>

      <div class="d-flex">
        <v-btn @click="zoomIn" :disabled="transform.k == scaleExtent[1]">
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
    <canvas :id="`${id}-canvas`" class="canvas" />
    <svg :id="`${id}-svg`" class="svg" />
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
