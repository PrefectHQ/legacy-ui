<script>
import * as d3_base from 'd3'
import * as d3_regression from 'd3-regression'

import uniqueId from 'lodash.uniqueid'
import debounce from 'lodash.debounce'

const d3 = Object.assign({}, d3_base, d3_regression)

const xAxisHeight = 50

const daysInMonth = (month, year) => new Date(year, month, 0).getDate()

export default {
  props: {
    baseline: {
      type: Number,
      required: false,
      default: () => 10000
    }
  },
  data() {
    return {
      id: uniqueId('usage'),
      format: null,
      ticks: null,
      period: 'Year',
      mainGroup: null,
      chart: null,
      xAxisGroup: null,
      yAxisGroup: null,
      height: null,
      width: null,

      padding: {
        bottom: xAxisHeight,
        left: 50,
        right: 50,
        top: 30,
        x: 100,
        y: xAxisHeight + 30
      },

      hovered: null,

      line: null,
      predict: null,
      regression: null,

      // Domain
      // from: null, // we use a computed prop for this based on the period
      // to: null, // we use a computed prop for this based on the period

      // Scales
      x: d3.scaleTime(),
      y: d3.scaleLinear()
    }
  },
  computed: {
    predictedItems() {
      if (!this.usage || !this.predict) return []
      const from = new Date(this.from)
      from.setMonth(this.from.getMonth() - 1)

      const to = new Date(this.to)
      to.setMonth(this.to.getMonth() + 1)

      const months = d3.timeMonth.range(from, to)

      const pastPrediction = Math.floor(this.predict(this.x(months[0])))
      const past = {
        timestamp: months[0],
        runs: pastPrediction < 0 ? 0 : pastPrediction
      }

      const futurePrediction = Math.floor(
        this.predict(this.x(months[months.length - 1]))
      )
      const future = {
        timestamp: months[months.length - 1],
        runs: futurePrediction < 0 ? 0 : futurePrediction
      }

      return [
        past,
        this.items[0],
        this.items[1],
        { timestamp: this.items[1].timestamp, runs: undefined },
        this.items[this.items.length - 2],
        this.items[this.items.length - 1],
        future
      ]
    },
    items() {
      if (!this.usage) return []
      const now = new Date()
      let range,
        setDate = true,
        setHours = true,
        setMinutes = true

      switch (this.period) {
        case 'Year':
          range = d3.timeMonth
          break
        case 'Month':
          range = d3.timeDay
          setDate = false
          break
        case 'Week':
          range = d3.timeDay
          setDate = false
          break
        case 'Day':
        default:
          range = d3.timeHour
          setDate = false
          setHours = false
          setMinutes = false
          break
      }

      return this.usage
        .filter(d => d.kind == 'USAGE')
        .reduce(
          (arr, d) => {
            const date = new Date(d.timestamp)
            date.setMilliseconds(0)
            date.setSeconds(0)

            if (setMinutes) {
              date.setMinutes(0)
            }

            if (setHours) {
              date.setHours(0)
            }

            if (setDate) {
              date.setDate(1)
            }

            const index = arr.findIndex(
              d_ => d_.timestamp == date.toISOString()
            )

            if (index > -1) {
              arr[index].runs += d.runs * -1
            } else {
              arr.push({
                timestamp: date.toISOString(),
                runs: d.runs * -1
              })
            }

            return arr
          },
          range.range(this.from, this.to).map(d => {
            const date = new Date(d)
            return {
              timestamp: date.toISOString(),
              runs: date > now ? undefined : 0
            }
          })
        )
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    },
    regressionItems() {
      // We do this to prevent modification of the original items array
      const items = Array.from(this.items, d => Object.assign({}, d))

      const lastIndex = items.length - 1
      const lastItem = items[lastIndex]
      const timestamp = new Date()
      const interpolatedRuns = Math.ceil(
        (lastItem.runs *
          daysInMonth(timestamp.getFullYear(), timestamp.getMonth())) /
          timestamp.getDate()
      )

      items[items.length - 1].runs = interpolatedRuns
      return items
    },
    resizeChart: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawResizeChart)
      }, 300)
    },
    from() {
      const from = new Date()

      if (this.period == 'Year') {
        const year = new Date().getFullYear()
        from.setFullYear(year - 1)
        from.setDate(1)
      } else if (this.period == 'Month') {
        from.setDate(1)
      } else if (this.period == 'Week') {
        const diff =
          from.getDate() - from.getDay() + (from.getDay() === 0 ? -6 : 1)
        from.setDate(diff)
      }

      from.setMinutes(1)
      from.setHours(0)
      return from
    },
    to() {
      const to = new Date()

      if (this.period == 'Year' || this.period == 'Month') {
        to.setMonth(to.getMonth() + 1)
        to.setDate(0)
      } else if (this.period == 'Week') {
        const diff = to.getDate() + (6 - to.getDay())
        to.setDate(diff)
      }

      to.setMinutes(59)
      to.setHours(23)
      return to
    }
  },
  watch: {
    usage(val) {
      if (!val) return
      this.updateScales()
      this.updateChart()
    },
    from() {
      this.$apollo.queries['usage'].refetch()
    }
  },
  mounted() {
    this.createChart()
    this.$apollo.queries['usage'].refetch()
  },
  updated() {
    if (!this.chart) this.createChart()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart)
  },
  methods: {
    barMouseover(e) {
      this.hovered = e.currentTarget?.__data__
    },
    barMouseout() {
      this.hovered = null
    },
    createChart() {
      this.chart = d3.select(`#${this.id}-svg`)
      this.mainGroup = this.chart.append('g').attr('class', 'main-group')
      this.predictionGroup = this.chart
        .append('g')
        .attr('class', 'prediction-group')
      this.xAxisGroup = this.chart.append('g').attr('class', 'x-axis-group')
      this.yAxisGroup = this.chart.append('g').attr('class', 'y-axis-group')

      window.addEventListener('resize', this.resizeChart)

      requestAnimationFrame(this.resizeChart)
    },
    rawResizeChart() {
      if (!this.chart) return

      let parent = this.chart.select(function() {
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

      this.width = Math.floor(parent.clientWidth - padding.left - padding.right)

      this.height = Math.floor(
        parent.clientHeight - padding.top - padding.bottom - this.padding.top
      )

      this.chart.attr('viewbox', `0 0 ${this.width} ${this.height}`)

      if (!this.items.length) return

      this.updateScales()
      this.updateChart()
    },
    updateChart() {
      const yOffset = this.height
      const bandwidth = Math.floor(
        ((this.width - this.padding.x) / this.ticks) * 0.8
      )

      console.log(this.from, this.to, this.items)
      // this.mainGroup
      //   .selectAll('circle')
      //   .data(this.items)
      //   .enter()
      //   .append('circle')
      //   .attr('cx', d => this.x(new Date(d.timestamp)) ?? 0)
      //   .attr('cy', d => this.height - this.y(d.runs))
      //   .attr('r', 5)

      this.mainGroup
        .selectAll('path')
        .data([this.items])
        .join(
          enter =>
            enter
              .append('path')
              .attr('stroke-width', 2)
              .attr('stroke', '#27b1ff')
              .attr('fill', 'none')
              .attr('d', d =>
                this.line(
                  Array.from(d, d_ => {
                    return { ...d_, runs: 0 }
                  })
                )
              )
              .call(enter =>
                enter
                  .transition()
                  .duration(1000)
                  .ease(d3.easeQuad)
                  .attr('d', this.line)
              ),
          update =>
            update.call(update =>
              update
                .transition()
                .duration(1000)
                .ease(d3.easeQuad)
                .attr('d', this.line)
            )
        )

      // Prediction pathing
      // this.predictionGroup
      //   .selectAll('path')
      //   .data([this.predictedItems])
      //   .join(
      //     enter =>
      //       enter
      //         .append('path')
      //         .attr('stroke-width', 1)
      //         .attr('stroke', '#FF5733')
      //         .attr('fill', 'none')
      //         .attr('d', d =>
      //           this.line(
      //             Array.from(d, d_ => {
      //               return { ...d_, runs: 0 }
      //             })
      //           )
      //         )
      //         .call(enter =>
      //           enter
      //             .transition()
      //             .duration(1000)
      //             .ease(d3.easeQuad)
      //             .attr('d', this.line)
      //         ),
      //     update =>
      //       update.call(update =>
      //         update
      //           .transition()
      //           .duration(1000)
      //           .ease(d3.easeQuad)
      //           .attr('d', this.line)
      //       )
      //   )

      // Bars

      this.mainGroup
        .selectAll('.bar-group')
        .data(this.items)
        .join(
          enter => {
            const g = enter
              .append('g')
              .attr('class', 'bar-group')
              .on('mouseover', this.barMouseover)
              .on('mouseout', this.barMouseout)

            g.append('rect')
              .attr('class', 'bar')
              .attr('height', d => (d.runs ? this.y(d.runs) : 0))
              .attr('width', bandwidth)
              .attr('fill', 'rgba(0,0,0,0.05)')
              // .attr('stroke-width', 3)
              // .attr('stroke', 'rgba(0, 0, 0, 0.12)')
              .attr('x', d => this.x(new Date(d.timestamp)))
              .attr('y', d => (d.runs ? yOffset - this.y(d.runs) : 0))
            // .style('transform', `translate(-${bandwidth / 2 ?? 0}px)`)

            // g.append('text')
            //   .attr('x', d => this.x(new Date(d.timestamp)) ?? 0)
            //   .attr('y', d =>
            //     d.runs ? yOffset - (this.y(d.runs) + 5 || 0) : yOffset
            //   )
            //   .style('text-anchor', 'middle')
            //   .style('transform', `translate(${bandwidth / 2 ?? 0}px)`)
            //   .style('font', '10px Roboto, sans-serif')
            //   .attr('fill', '#546E7A')
            //   .text(d => d.runs?.toLocaleString())
            return g
          },
          update => {
            const bar = update.selectAll('rect')
            bar
              .attr('height', d => (d.runs ? this.y(d.runs) : 0))
              .attr('width', bandwidth)
              .attr('x', d => {
                console.log(
                  this.x(new Date(d.timestamp)),
                  new Date(d.timestamp)
                )
                return this.x(new Date(d.timestamp))
              })
              .attr('y', d => (d.runs ? yOffset - this.y(d.runs) : 0))
            // .style('transform', `translate(-${bandwidth / 2 ?? 0}px)`)

            // const text = update.select('text')
            // text
            //   .attr('x', d => this.x(new Date(d.timestamp)) ?? 0)
            //   .attr('y', d =>
            //     d.runs ? yOffset - (this.y(d.runs) + 5 || 0) : yOffset
            //   )
            //   .style('transform', `translate(${bandwidth / 2 ?? 0}px)`)
            //   .text(d => d.runs?.toLocaleString())
          },
          exit =>
            exit.call(exit =>
              exit
                .on('click', null)
                .on('mouseout', null)
                .on('mouseover', null)
                .transition('exit')
                .duration(500)
                .remove()
            )
        )
    },
    updateScales() {
      this.x.domain([this.from, this.to])
      this.x.range([this.padding.left, this.width - this.padding.right])

      this.y.domain([d3.max(this.items.map(d => d.runs)), 0])
      this.y.range([this.padding.top, this.height - this.padding.y])

      const nullY = this.y(0)

      this.line = d3
        .line()
        .curve(d3.curveMonotoneX)
        .defined(d => !isNaN(d.runs)) // Use this to create gaps in data
        .x(d => this.x(new Date(d.timestamp)) ?? 0)
        .y(d => this.height + (this.y(d.runs) - nullY) || 0)

      this.regression = d3
        .regressionLinear()
        .x(d => this.x(new Date(d.timestamp)))
        .y(d => d.runs)(this.regressionItems)

      this.predict = this.regression.predict

      switch (this.period) {
        case 'Year':
          this.ticks = 12
          this.format = '%B'
          break
        case 'Month':
          this.ticks = 31
          this.format = '%e'
          break
        case 'Week':
          this.ticks = 7
          this.format = '%A'
          break
        default:
          break
      }

      const xAxis = d3
        .axisBottom(this.x)
        .ticks(this.ticks)
        .tickSizeOuter(0)
        .tickFormat(d3.timeFormat(this.format))

      const yAxis = d3
        .axisRight(this.y)
        // .ticks(12)
        .tickSizeOuter(0)
        .tickSize(this.width - this.padding.x)

      this.xAxisGroup
        .attr('transform', `translate(0,${this.height})`)
        .transition()
        .duration(1000)
        .ease(d3.easeQuad)
        .call(xAxis)

      this.yAxisGroup
        .attr(
          'transform',
          `translate(${this.padding.right}, ${this.padding.y})`
        )
        .transition()
        .duration(1000)
        .ease(d3.easeQuad)
        .call(yAxis)
    }
  },
  apollo: {
    usage: {
      query: require('@/graphql/TeamSettings/usage.gql'),
      variables() {
        return {
          from: this.from,
          to: this.to
        }
      },
      skip() {
        return !this.from || !this.to
      },
      update: data => data?.usage
    }
  }
}
</script>

<template>
  <v-card class="position-relative" tile fluid>
    <!-- <div class="caption text-left grey--text card-title">
      <v-icon x-small>pi-gantt</v-icon><span class="ml-1">Timeline</span>
    </div> -->

    <div class="d-flex align-center justify-space-between py-4 px-8 card-title">
      <div class="text-h4">Usage</div>
      <div style="max-width: 300px;">
        <v-select
          v-model="period"
          :items="['Year', 'Month', 'Week']"
          :menu-props="{
            'offset-y': true,
            transition: 'slide-y-transition'
          }"
          outlined
          dense
          hide-details
          label="Show by"
          required
        ></v-select>
      </div>
    </div>

    <v-card-text ref="parent" class="chart-container pa-0">
      <svg :id="`${id}-svg`" class="svg" />
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.chart-container {
  height: 100%;
  position: relative;
  width: 100%;
}

svg {
  height: 100%;
  margin: auto;
  width: 100%;
}

.card-title {
  // left: 8px;
  position: absolute;
  width: 100%;
  z-index: 1;
  // top: 8px;
}
</style>

<style lang="scss">
// We use unscoped css here
// so that we don't need to do a post-selection
// on the axis
.x-axis-group {
  color: #9e9e9e !important;
  font: 10px Roboto, sans-serif;
  opacity: 0.8;
  user-select: none;

  .domain {
    stroke: rgba(0, 0, 0, 0.12);
    stroke-width: 1.65px;
  }

  .tick line {
    opacity: 0;
  }
}

.y-axis-group {
  color: #9e9e9e !important;
  font: 9px Roboto, sans-serif;
  opacity: 0.8;
  user-select: none;

  .domain {
    opacity: 0;
  }

  .tick line {
    stroke: rgba(0, 0, 0, 0.05);
    stroke-dasharray: 10, 10;
    stroke-width: 1.65px;
  }

  .tick:last-of-type line {
    opacity: 0;
  }
}
</style>
