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
      mainGroup: null,
      chart: null,
      xAxisGroup: null,
      height: null,
      width: null,

      padding: {
        bottom: xAxisHeight,
        left: 50,
        right: 50,
        top: 70,
        x: 100,
        y: xAxisHeight + 70
      },

      hovered: null,

      line: null,
      predict: null,
      regression: null,

      // Domain
      from: null,
      to: null,

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
      return this.usage
        .filter(d => d.kind == 'USAGE')
        .reduce(
          (arr, d) => {
            const date = new Date(d.timestamp)
            date.setMilliseconds(0)
            date.setSeconds(0)
            date.setMinutes(0)
            date.setHours(0)
            date.setDate(1)

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
          d3.timeMonth.range(this.from, this.to).map(d => {
            return { timestamp: new Date(d).toISOString(), runs: 0 }
          })
        )
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
    }
  },
  watch: {
    usage(val) {
      if (!val) return
      this.updateScales()
      this.updateChart()
    }
  },
  mounted() {
    const year = new Date().getFullYear()
    this.from = new Date()

    this.from.setFullYear(year - 1)
    this.from.setMinutes(0)
    this.from.setHours(0)
    this.from.setDate(1)

    this.to = new Date()
    this.to.setMinutes(59)
    this.to.setHours(23)

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
        parent.clientHeight - padding.top - padding.bottom
      )

      this.chart.attr('viewbox', `0 0 ${this.width} ${this.height}`)

      if (!this.items.length) return

      this.updateScales()
      this.updateChart()
    },
    updateChart() {
      // const yOffset = this.height - this.padding.bottom
      // const bandwidth = this.x.bandwidth()
      //  .x(d => this.x(new Date(d.timestamp)) ?? 0)
      //         .y(d => this.y(d.runs) || 0)

      console.log(this.items)
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
              .attr('stroke-width', 1)
              .attr('stroke', '#000')
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

      this.predictionGroup
        .selectAll('path')
        .data([this.predictedItems])
        .join(
          enter =>
            enter
              .append('path')
              .attr('stroke-width', 1)
              .attr('stroke', '#FF5733')
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

      // this.mainGroup
      //   // .append('g')
      //   .selectAll('path')
      //   .data([this.items])
      //   .join('path')
      //   // .style('mix-blend-mode', 'multiply')
      //   .attr('d', this.line)
      // this.mainGroup
      //   .selectAll('path')
      //   .data(this.items)
      //   .join(
      //     enter => {
      //       return enter.append('path').attr(
      //         'd',
      //         d3
      //           .area()
      //           .x(d => this.x(new Date(d.timestamp)) ?? 0)
      //           .y0(this.y(0))
      //           .y1(d => yOffset - (this.y(d.runs) || 0))
      //       )
      //     },
      //     update =>
      //       update.attr(
      //         'd',
      //         d3
      //           .area()
      //           .x(d => this.x(new Date(d.timestamp)) ?? 0)
      //           .y0(this.y(0))
      //           .y1(d => yOffset - (this.y(d.runs) || 0))
      //       )
      //   )
      // this.mainGroup
      //   .selectAll('.bar-group')
      //   .data(this.items)
      //   .join(
      //     enter => {
      //       const g = enter
      //         .append('g')
      //         .attr('class', 'bar-group')
      //         .on('mouseover', this.barMouseover)
      //         .on('mouseout', this.barMouseout)
      //       g.append('rect')
      //         .attr('class', 'bar')
      //         .attr('height', d => this.y(d.runs) || 0)
      //         .attr('width', bandwidth)
      //         .attr('fill', '#27b1ff')
      //         // .attr('stroke-width', 3)
      //         // .attr('stroke', 'rgba(0, 0, 0, 0.12)')
      //         .attr('x', d => this.x(new Date(d.timestamp)) ?? 0)
      //         .attr('y', d => yOffset - (this.y(d.runs) || 0))
      //       g.append('text')
      //         .attr('x', d => this.x(new Date(d.timestamp)) ?? 0)
      //         .attr('y', d => yOffset - (this.y(d.runs) + 5 || 0))
      //         .style('text-anchor', 'middle')
      //         .style('transform', `translate(${bandwidth / 2 ?? 0}px)`)
      //         .style('font', '10px Roboto, sans-serif')
      //         .attr('fill', '#546E7A')
      //         .text(d => d.runs.toLocaleString())
      //       return g
      //     },
      //     update => {
      //       const bar = update.selectAll('rect')
      //       bar
      //         .attr('height', d => this.y(d.runs) || 0)
      //         .attr('width', bandwidth)
      //         .attr('x', d => this.x(new Date(d.timestamp)) ?? 0)
      //         .attr('y', d => yOffset - (this.y(d.runs) || 0))
      //       const text = update.select('text')
      //       text
      //         .attr('x', d => this.x(new Date(d.timestamp)) ?? 0)
      //         .attr('y', d => yOffset - (this.y(d.runs) + 5 || 0))
      //         .style('transform', `translate(${bandwidth / 2 ?? 0}px)`)
      //         .text(d => d.runs.toLocaleString())
      //     },
      //     exit =>
      //       exit.call(exit =>
      //         exit
      //           .on('click', null)
      //           .on('mouseout', null)
      //           .on('mouseover', null)
      //           .transition('exit')
      //           .duration(500)
      //           .remove()
      //       )
      //   )
    },
    updateScales() {
      this.x.domain([this.from, this.to])
      this.x.range([this.padding.left, this.width - this.padding.right])

      this.y.domain([0, d3.max(this.items.map(d => d.runs))])
      this.y.range([this.padding.top, this.height - this.padding.y])

      this.line = d3
        .line()
        .curve(d3.curveMonotoneX)
        .defined(d => !isNaN(d.runs)) // Use this to create gaps in data
        .x(d => this.x(new Date(d.timestamp)) ?? 0)
        .y(d => this.height - this.y(d.runs) || 0)

      this.regression = d3
        .regressionLinear()
        .x(d => this.x(new Date(d.timestamp)))
        .y(d => d.runs)(this.regressionItems)

      this.predict = this.regression.predict

      const xAxis = d3
        .axisBottom(this.x)
        .ticks(12)
        .tickSizeOuter(0)
        .tickFormat(d3.timeFormat('%B'))

      this.xAxisGroup
        .attr('transform', `translate(0,${this.height - this.padding.bottom})`)
        .call(xAxis)
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
    <div class="caption text-left grey--text card-title">
      <v-icon x-small>pi-gantt</v-icon><span class="ml-1">Timeline</span>
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
  left: 8px;
  position: absolute;
  top: 8px;
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
</style>
