<script>
import * as d3 from 'd3'
import uniqueId from 'lodash.uniqueid'
import debounce from 'lodash.debounce'

const xAxisHeight = 20

export default {
  data() {
    return {
      id: uniqueId('usage'),
      barGroup: null,
      chart: null,
      xAxisGroup: null,
      height: null,
      width: null,

      padding: {
        bottom: xAxisHeight,
        left: 5,
        right: 5,
        top: 20,
        x: 10,
        y: xAxisHeight + 20
      },

      hovered: null,

      // Domain
      from: null,
      to: null,

      // Scales
      x: d3.scaleBand(),
      y: d3.scaleLinear()
    }
  },
  computed: {
    items() {
      if (!this.usage) return []

      return this.usage
        .filter(d => d.kind == 'USAGE')
        .reduce((arr, d) => {
          const date = new Date(d.timestamp)
          date.setMilliseconds(0)
          date.setSeconds(0)
          date.setMinutes(0)
          date.setHours(0)
          date.setDate(1)

          const index = arr.findIndex(d_ => d_.timestamp == date.toISOString())
          if (index > -1) {
            arr[index].runs += d.runs * -1
          } else {
            arr.push({
              timestamp: date.toISOString(),
              runs: d.runs * -1
            })
          }

          return arr
        }, [])
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
    this.from.setDate(0)

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
      this.barGroup = this.chart.append('g').attr('class', 'bar-group')
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
      const yOffset = this.height - this.padding.bottom
      const bandwidth = this.x.bandwidth()

      this.barGroup
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
              .attr('height', d => this.y(d.runs) || 0)
              .attr('width', bandwidth)
              .attr('fill', '#27b1ff')
              // .attr('stroke-width', 3)
              // .attr('stroke', 'rgba(0, 0, 0, 0.12)')
              .attr('x', d => this.x(new Date(d.timestamp)) ?? 0)
              .attr('y', d => yOffset - (this.y(d.runs) || 0))

            g.append('text')
              .attr('x', d => this.x(new Date(d.timestamp)) ?? 0)
              .attr('y', d => yOffset - (this.y(d.runs) + 5 || 0))
              .style('text-anchor', 'middle')
              .style('transform', `translate(${bandwidth / 2 ?? 0}px)`)
              .style('font', '10px Roboto, sans-serif')
              .attr('fill', '#546E7A')
              .text(d => d.runs.toLocaleString())

            return g
          },
          update => {
            const bar = update.selectAll('rect')

            bar
              .attr('height', d => this.y(d.runs) || 0)
              .attr('width', bandwidth)
              .attr('x', d => this.x(new Date(d.timestamp)) ?? 0)
              .attr('y', d => yOffset - (this.y(d.runs) || 0))

            const text = update.select('text')

            text
              .attr('x', d => this.x(new Date(d.timestamp)) ?? 0)
              .attr('y', d => yOffset - (this.y(d.runs) + 5 || 0))
              .style('transform', `translate(${bandwidth / 2 ?? 0}px)`)
              .text(d => d.runs.toLocaleString())
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
      const xRange = [this.padding.left, this.width - this.padding.right]

      this.x
        .rangeRound(xRange)
        .paddingInner(0.6)
        .paddingOuter(0.2)

      this.x.domain(d3.timeMonth.range(this.from, this.to))

      this.y.domain([1, d3.max(this.items.map(d => d.runs))])
      this.y.range([this.padding.top, this.height - this.padding.y])

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
