<script>
import * as d3 from 'd3'
import uniqueId from 'lodash.uniqueid'
import debounce from 'lodash.debounce'

export default {
  props: {
    height: { type: Number, default: () => null },
    width: { type: Number, default: () => null }
  },
  data() {
    return {
      id: uniqueId('usage'),
      barGroup: null,
      chart: null,
      chartHeight: null,
      chartWidth: null,
      from: null,
      to: null
    }
  },
  computed: {
    items() {
      if (!this.usage) return []
      return this.usage
    },
    resizeChart: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawResizeChart)
      }, 300)
    }
  },
  watch: {
    usage(val) {
      console.log('usage watcher')
      if (!val) return
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
    createChart() {
      this.chart = d3.select(`#${this.id}-svg`)

      window.addEventListener('resize', this.resizeChart)

      requestAnimationFrame(this.resizeChart)
    },
    rawResizeChart() {
      if (!this.chart) return

      let parent = this.chart.select(function() {
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

      this.boundingClientRect = this.$refs['parent']?.getBoundingClientRect()

      const width =
        parent._groups[0][0].clientWidth - paddingLeft - paddingRight

      const height =
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

      this.barGroup = this.chart.append('g').attr('class', 'bar-group')

      this.updateChart()
    },
    updateChart() {
      this.barGroup
        .selectAll('.bar')
        .data(this.items)
        .join(
          enter =>
            enter
              .append('rect')
              .attr('class', 'bar')
              .attr('height', 10)
              .attr('width', 5),
          update => update.attr('height', 5),
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
  <v-container fluid class="pa-0">
    <svg :id="`${id}-svg`" class="svg" />
  </v-container>
</template>

<style lang="scss" scoped>
svg {
  background-color: #ffc0cb;
  height: 100%;
  width: 100%;
}
</style>
