<script>
import * as d3 from 'd3'
import { mapGetters } from 'vuex'
import uniqueId from 'lodash/uniqueId'
import throttle from 'lodash/throttle'
import debounce from 'lodash/debounce'

export default {
  props: {
    // Breaklines should be a list of objects with the following format:
    // { label: String, value: UUID }
    // where the UUID corresponds to an item passed
    breaklines: { type: Array, default: () => [] },
    height: { type: Number, default: () => null },
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: () => false },
    minBands: { type: Number, default: () => null },
    normalize: { type: Boolean, default: () => true },
    padding: { type: Number, default: () => 2 },
    showControls: { type: Boolean, default: () => false },
    visible: { type: Boolean, default: () => true },
    width: { type: Number, default: () => null },
    yField: { type: String, default: () => null }
  },
  data() {
    return {
      id: uniqueId('barChart'),
      animationTimer: null,
      bars: [],
      boundingClientRect: null,
      canvas: null,
      chartHeight: null,
      chart: null,
      easing: 'easeCubic',
      groupBreaklines: null,
      groupClickArea: null,
      groupRect: null,
      groupText: null,
      hovered: null,
      hoveredId: null,
      breaklineUnwatch: null,
      itemUnwatch: null,
      visibleUnwatch: null,
      loadingInterval: null,
      loadingItems: [],
      nowLine: null,
      pattern: null,
      previousItems: null,
      restrictOutliers: this.normalize,
      sum: 0,
      timer: null,
      visibilityListenerAdded: false,
      wasLoading: false,
      x: null,
      xShift: 0,
      y: null,
      yShift: 0
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    computedStyle() {
      return getComputedStyle(document.body)
    },
    computedItems() {
      return this.loading ? this.loadingItems : this.items
    },
    computedMouseout: function() {
      return debounce(this.rawMouseout, 0, { trailing: true, leading: false })
    },
    computedYField() {
      return this.loading ? 'value' : this.yField
    },
    animationDuration() {
      return this.loading ? 500 : 500
    },
    barStart() {
      return this.chartHeight - this.chartHeight * 0.1
    },
    animateCanvas: function() {
      return throttle(this.rawAnimateCanvas, 16)
    },
    resizeChart: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawResizeChart)
      }, 300)
    },
    min() {
      return this.chartHeight * 0.15
    },
    tooltipStyle() {
      if (!this.hovered) return
      let p = this.boundingClientRect
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
    normalize() {
      this.updateChart()
    },
    restrictOutliers() {
      this.updateChart()
    }
  },
  mounted() {
    this.createScheduledCanvas()
    this.createChart()

    this.loadingItems = Array.from({ length: this.minBands }, (d, i) => {
      return {
        id: i,
        value: Math.floor(Math.random() * 100)
      }
    })

    this.boundingClientRect = this.$refs['parent']?.getBoundingClientRect()

    this.breaklineUnwatch = this.$watch(
      'breaklines',
      debounce(function() {
        if (!this.chart) this.createChart()
        if (this.loading || !this.visible) return
        this.updateBreaklines()
      }, 500)
    )
    this.itemUnwatch = this.$watch(
      'items',
      debounce(function() {
        this.updateChart()
      }, 500),
      { deep: true }
    )

    this.visibleUnwatch = this.$watch('visible', val => {
      if (val) {
        this.resizeChart()
      }
    })
  },
  updated() {
    if (!this.chart) this.createChart()
  },
  beforeDestroy() {
    clearTimeout(this.loadingInterval)

    window.removeEventListener('resize', this.resizeChart)
    window.removeEventListener('visibilitychange', this.handleVisibilityChange)

    this.itemUnwatch()
    this.breaklineUnwatch()
    this.visibleUnwatch()
  },
  methods: {
    calcHeight(d) {
      if (d.ignore) return this.barStart / 3
      let height = this.y(0) - this.y(d[this.computedYField])
      return height > this.min ? height : this.min
    },
    calcY(d) {
      if (d.ignore) return this.barStart / 1.5
      let _y = this.y(d[this.computedYField])
      return _y < this.barStart - this.min ? _y : this.barStart - this.min
    },
    click({ currentTarget }) {
      // Turn this on for debugging bars more easily
      // console.log(
      //   d,
      //   this.bars.find(b => b.id == d.id)
      // )
      this.$emit('bar-click', currentTarget?.__data__)
    },
    mouseover({ currentTarget }) {
      const d = currentTarget?.__data__

      this.computedMouseout.cancel()
      this.hovered = {
        data: d,
        x: this.x(d.id),
        y: this.chartHeight,
        width: this.x.bandwidth(),
        height: this.calcHeight(d)
      }
      this.$emit('bar-mouseover', this.hovered)

      this.hoveredId = d.id

      this.animateCanvas()
    },
    rawMouseout() {
      this.$emit('bar-mouseout', this.hovered)
      this.hovered = null
      this.hoveredId = null

      this.animateCanvas()
    },
    createChart() {
      this.chart = d3.select(`#${this.id}`)
      this.canvas = d3.select(`#${this.id}-canvas`)

      this.groupClickArea = this.chart
        .append('g')
        .attr('class', 'click-area-rect-group')
      this.groupRect = this.chart.append('g').attr('class', 'rect-group')
      this.groupText = this.chart.append('g').attr('class', 'text-group')
      this.groupBreaklines = this.chart
        .append('g')
        .attr('class', 'breaklines-group')

      window.addEventListener('resize', this.resizeChart)

      requestAnimationFrame(this.resizeChart)
    },
    rawAnimateCanvas() {
      cancelAnimationFrame(this.drawCanvas)

      const barWidth = this.x.bandwidth()

      // Check our current data against existing bars
      this.computedItems.forEach((item, i) => {
        const barIndex = this.bars.findIndex(b => b.id == item.id)

        const height1 = this.calcHeight(item)
        const x1 = this.x(item.id || i)
        const y1 = this.calcY(item)
        const opacity = item.opacity ? item.opacity : 1

        // If the item isn't present in the bar array
        // we instantiate a new bar...
        if (barIndex < 0) {
          this.bars.push({
            ...item,
            height0: 0,
            height1: height1,
            height: 0,
            width: barWidth,
            x0: x1,
            x1: x1,
            x: x1,
            y0: this.barStart,
            y1: y1,
            y: this.barStart,
            opacity: opacity
          })
        } else {
          // ...otherwise we update the existing bar with
          // new values
          const bar = this.bars[barIndex]
          const bar1 = {
            height0: bar.height,
            height1: height1,
            width: barWidth,
            x0: bar.x || 0,
            x1: x1,
            y0: bar.y || this.barStart,
            y1: y1,
            opacity: opacity
          }

          this.bars[barIndex] = { ...bar, ...bar1, ...item }
        }
      })

      // Check our existing bars against current data
      this.bars.forEach((bar, i) => {
        const itemExists = this.computedItems.find(item => item.id == bar.id)

        // If this is a valid bar, do nothing since its data was already
        // updated in the loop above...
        if (itemExists) return

        // ...otherwise we'll start the exit animation
        const bar1 = {
          height0: bar.height,
          height1: 0,
          width: barWidth,
          y0: bar.y,
          y1: this.barStart,
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
            : bar.opacity
          bar.x = bar.x0 * (1 - t) + bar.x1 * t
          bar.y = bar.y0 * (1 - t) + bar.y1 * t
          bar.height = bar.height0 * (1 - t) + bar.height1 * t
        })

        try {
          requestAnimationFrame(this.drawCanvas)
        } catch {
          this.timer.stop()
        }

        if (t === 1 || document.hidden) {
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
    createScheduledCanvas() {
      this.pattern = document.createElement('canvas')
      const context = this.pattern.getContext('2d')

      const x = 32
      this.pattern.width = x
      this.pattern.height = x / 2

      const x0 = 36
      const x1 = -4
      const y0 = -2
      const y1 = 18
      const offset = 32

      context.fillStyle = this.computedStyle?.getPropertyValue(
        '--v-ScheduledAlt-base'
      )
      context.fillRect(0, 0, x, x)

      context.strokeStyle = this.computedStyle?.getPropertyValue(
        '--v-Scheduled-base'
      )
      context.lineWidth = 6
      context.beginPath()
      context.moveTo(x0, y0)
      context.lineTo(x1, y1)
      context.moveTo(x0 - offset, y0)
      context.lineTo(x1 - offset, y1)
      context.moveTo(x0 + offset, y0)
      context.lineTo(x1 + offset, y1)
      context.stroke()
    },
    drawCanvas() {
      const context = this.canvas.node().getContext('2d')

      context.save()
      context.lineWidth = 2
      try {
        context.strokeStyle = this.computedStyle.getPropertyValue(
          '--v-appBackground-base'
        )
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e)
        cancelAnimationFrame(this.drawCanvas)
        this.timer.stop()
        this.bars = []
      }

      context.clearRect(0, 0, this.chartWidth, this.chartHeight)

      let len = this.bars?.length
      for (let i = 0; i < len; ++i) {
        const bar = this.bars[i]

        context.beginPath()
        context.globalAlpha = bar.alpha
        context.fillStyle = bar.usePattern
          ? context.createPattern(this.pattern, 'repeat')
          : bar.color ||
            this.computedStyle?.getPropertyValue('--v-secondaryGrayLight-base')

        context.rect(bar.x, bar.y, bar.width, bar.height)
        context.fill()
        context.stroke()
      }

      context.restore()
    },
    rawResizeChart() {
      let parent = this.chart.select(function() {
        return this.parentNode
      })

      let computedStyle = window.getComputedStyle(parent._groups[0][0], null)

      let paddingLeft = parseFloat(
          computedStyle?.getPropertyValue('padding-left')
        ),
        paddingRight = parseFloat(
          computedStyle?.getPropertyValue('padding-right')
        ),
        paddingTop = parseFloat(computedStyle?.getPropertyValue('padding-top')),
        paddingBottom = parseFloat(
          computedStyle?.getPropertyValue('padding-bottom')
        )

      this.boundingClientRect = this.$refs['parent']?.getBoundingClientRect()

      const width =
        this.width ||
        parent._groups[0][0].clientWidth - paddingLeft - paddingRight

      const height =
        this.height ||
        parent._groups[0][0].clientHeight - paddingTop - paddingBottom

      if (!height || !width || height <= 0 || width <= 0) {
        return
      }

      this.chartWidth = width
      this.chartHeight = height

      this.chart
        .attr('viewbox', `0 0 ${this.chartWidth} ${this.chartHeight}`)
        .attr('width', this.chartWidth)
        .attr('height', this.chartHeight)

      this.canvas
        .attr('width', this.chartWidth)
        .attr('height', this.chartHeight)
        .style('width', this.chartWidth)
        .style('height', this.chartHeight)

      this.updateChart()
    },
    updateBreaklines() {
      if (!this.x) return

      this.groupBreaklines
        .selectAll('.breaklines-group')
        .data(this.loading ? [] : this.breaklines)
        .join(
          enter => {
            const g = enter
              .append('g')
              .attr('transform', 'translate(0)')
              .attr('class', 'breaklines-group')

            g.append('path')
              .attr(
                'stroke',
                this.computedStyle?.getPropertyValue('--v-utilGrayMid-base')
              )
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', 5)
              .attr('d', `M0,10L0,${this.chartHeight}`)
              .style('pointer-events', 'none')

            g.append('text')
              .style('font-size', '8px')
              .style('pointer-events', 'none')
              .attr(
                'fill',
                this.computedStyle?.getPropertyValue('--v-utilGrayMid-base')
              )
              .attr('text-anchor', d => d.anchor || 'middle')
              .text(d => d.label)
              .attr('y', 6)
              .style('opacity', 0)
              .transition()
              .delay(this.animationDuration)
              .duration(150)
              .style('opacity', 1)

            return g.call(enter =>
              enter
                .transition('enter')
                .duration(500)
                .attr(
                  'transform',
                  d =>
                    `translate(${
                      d.value && this.x(d.value)
                        ? this.x(d.value) + (d.after ? this.x.bandwidth() : 0)
                        : -20
                    })`
                )
            )
          },
          update =>
            update.call(update => {
              update
                .select('text')
                .attr('text-anchor', d => d.anchor || 'middle')
                .text(d => d.label)
                .transition()
                .delay(this.animationDuration)
                .duration(150)
                .style('opacity', 1)

              return update.call(update =>
                update
                  .transition('update')
                  .duration(this.animationDuration)
                  .attr(
                    'transform',
                    d =>
                      `translate(${
                        d.value
                          ? this.x(d.value) + (d.after ? this.x.bandwidth() : 0)
                          : -20
                      })`
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
    handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        if (this.$el) {
          requestAnimationFrame(this.updateChart)
        }

        window.removeEventListener(
          'visibilitychange',
          this.handleVisibilityChange
        )
        this.visibilityListenerAdded = false
      }
    },
    updateChart() {
      if (document.hidden) {
        if (this.visibilityListenerAdded || !this.$el) return
        window.addEventListener('visibilitychange', this.handleVisibilityChange)
        this.visibilityListenerAdded = true
        return
      }

      if (!this.visible) return
      if (!this.computedItems) return
      if (!this.loading) clearTimeout(this.loadingInterval)

      let domainItems = this.computedItems.map((d, i) => (d.id ? d.id : i))

      let domain = this.minBands
        ? domainItems?.length > this.minBands
          ? domainItems
          : [
              ...domainItems,
              ...Array.from(
                { length: this.minBands - domainItems?.length },
                (d, i) => i
              )
            ]
        : domainItems

      const x = d3
        .scaleBand()
        .domain(domain)
        .range([0, this.chartWidth])
        .paddingOuter([this.padding])

      this.x = x

      let yMax = d3.max(this.computedItems, d => d[this.computedYField])

      let y

      if (this.restrictOutliers) {
        y = d3.scalePow().exponent([0.4])
      } else {
        y = d3.scaleLinear()
      }

      y.range([this.barStart, this.chartHeight * 0.2]).domain([
        0,
        this.loading ? 100 : yMax > 0 ? yMax : 100
      ])

      this.y = y

      this.groupClickArea
        .selectAll('.click-area-rect')
        .data(this.loading ? [] : this.computedItems)
        .join(
          enter =>
            enter
              .append('rect')
              .attr('stroke-width', 0)
              .style('cursor', 'pointer')
              .attr('class', 'click-area-rect')
              .attr('id', d => `click-area-${d.id}`)
              .style('fill', 'transparent')
              .attr('height', this.barStart)
              .attr('width', x.bandwidth() || 0)
              .attr('y', 0)
              .attr('x', (d, i) => x(d.id ? d.id : i) || 0)
              .call(enter =>
                enter
                  .on('click', this.click)
                  .on('mouseout', this.computedMouseout)
                  .on('mouseover', this.mouseover)
              ),
          update =>
            update
              .attr('id', d => `click-area-${d.id}`)
              .attr('height', this.barStart)
              .attr('width', x.bandwidth() || 0)
              .attr('y', 0)
              .attr('x', (d, i) => x(d.id ? d.id : i) || 0)
              .call(update =>
                update
                  .on('click', this.click)
                  .on('mouseout', this.computedMouseout)
                  .on('mouseover', this.mouseover)
              ),
          exit =>
            exit.call(exit =>
              exit
                .on('click', null)
                .on('mouseout', null)
                .on('mouseover', null)
                .transition('exit')
                .duration(this.animationDuration)
                .remove()
            )
        )

      // We don't use filter on this so we can maintain
      // the correct index for the x scale
      this.groupText
        .selectAll('.warning-text')
        .data(this.loading ? [] : this.computedItems)
        .join(
          enter =>
            enter
              .append('text')
              .attr('class', 'warning-text')
              .style('font-family', 'Material Icons')
              .style('pointer-events', 'none')
              .style('font-size', '12px')
              .attr('fill', 'var(--v-deepRed-base)')
              .attr('id', d => d.id + 'warning')
              .style('opacity', 0)
              .attr('text-anchor', 'middle')
              .text('timelapse')
              .attr('y', this.barStart / 1.5 - 3)
              .attr('x', d => x(d.id) + x.bandwidth() / 2 || 0)
              .call(enter =>
                enter
                  .transition('enter')
                  .delay((d, i) => i * 10)
                  .duration(this.animationDuration)
                  .style('opacity', d =>
                    'warningOpacity' in d ? d.warningOpacity : 0
                  )
              ),
          update =>
            update.call(update =>
              update
                .transition('update')
                .duration(this.animationDuration)
                .attr('x', d => x(d.id) + x.bandwidth() / 2)
                .style('opacity', d =>
                  'warningOpacity' in d ? d.warningOpacity : 0
                )
            ),
          exit =>
            exit.call(exit =>
              exit
                .transition('exit')
                .duration(this.animationDuration)
                .style('opacity', 0)
                .remove()
            )
        )

      this.chart
        .selectAll('.x-axis')
        .data([x])
        .join(enter =>
          enter
            .append('path')
            .attr('class', 'x-axis')
            .attr('stroke', 'rgba(0, 0, 0, 0.12)')
            .attr('stroke-width', 1)
            .attr('d', `M0,${this.barStart || 0}L0,${this.barStart || 0}`)
            .call(enter =>
              enter
                .transition('enter')
                .duration(this.animationDuration)
                .attr(
                  'd',
                  `M0,${this.barStart}L${this.chartWidth},${this.barStart}`
                )
            )
        )

      this.updateBreaklines()
      this.animateCanvas()

      if (this.loading && !this.loadingInterval) {
        this.loadingInterval = setInterval(() => {
          this.loadingItems.forEach(
            d => (d.value = Math.floor(Math.random() * 125 - 25))
          )
          this.updateChart()
        }, this.animationDuration)
      }
    }
  }
}
</script>

<template>
  <div ref="parent" class="barchart position-relative">
    <svg :id="id" preserveAspectRatio="xMinYMin meet">
      <pattern
        id="future-run"
        width="8"
        height="8"
        patternTransform="rotate(45 0 0)"
        patternUnits="userSpaceOnUse"
      >
        <g>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            style="
          opacity: 1;
          stroke: var(--v-Scheduled-base);
          stroke-width: 8;"
          />

          <line
            x1="8"
            y1="0"
            x2="8"
            y2="8"
            style="
          opacity: 0.2;
          stroke: var(--v-Scheduled-base);
          stroke-width: 8;"
          />
        </g>
      </pattern>
    </svg>

    <canvas :id="id + '-canvas'" class="canvas" />

    <transition name="tooltip-fade" mode="in-out">
      <div
        v-if="$slots['tooltip']"
        class="v-tooltip__content barchart-tooltip"
        :style="tooltipStyle"
      >
        <slot name="tooltip" />
      </div>
    </transition>

    <v-menu v-if="showControls" bottom left :close-on-content-click="false">
      <template #activator="{ on }">
        <v-btn icon small class="input-menu" v-on="on">
          <v-icon>more_vert</v-icon>
        </v-btn>
      </template>

      <v-list dense tile>
        <v-list-item>
          <v-checkbox
            v-model="restrictOutliers"
            label="Normalize"
            hide-details
            class="v-input--reverse input-menu-item ma-0"
          ></v-checkbox>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<style lang="scss" scoped>
.barchart-tooltip {
  background-color: var(--v-utilGrayMid-darken2);
  pointer-events: none;
  position: absolute;
  text-overflow: initial;
  transform: translate(-50%);
  transition: all 150ms;
  user-select: none;
  width: 375px !important;
  z-index: 4;
}

.input-menu {
  opacity: 0.35;
  position: absolute;
  right: 0;
  top: -14px;
}

.input-menu-item {
  transform: scale(0.9);
}

.barchart {
  &:focus,
  &:hover {
    .input-menu {
      opacity: 1;
    }
  }
}

.canvas {
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
}
</style>
