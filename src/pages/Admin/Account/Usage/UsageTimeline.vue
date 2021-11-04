<script>
import * as d3_base from 'd3'
import * as d3_regression from 'd3-regression'

import uniqueId from 'lodash/uniqueId'
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'
import { mapGetters } from 'vuex'

const d3 = Object.assign({}, d3_base, d3_regression)

const xAxisHeight = 40

const startDate = new Date('2018-01-17T00:00:00+00:00')

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
      selectedTeam: null,
      format: null,
      ticks: null,
      period: 'Year',
      hoverGroup: null,
      interactionGroup: null,
      mainGroup: null,
      chart: null,
      offset: 0,
      xAxisGroup: null,
      yAxisGroup: null,
      height: null,
      width: null,

      padding: {
        bottom: xAxisHeight,
        left: 80,
        right: 20,
        top: 10,
        x: 100,
        y: xAxisHeight + 10
      },

      hovered: null,
      showPath: false,
      showBars: true,
      showText: false,

      items: [],
      line: null,
      previousLine: null,
      predict: null,
      regression: null,

      // Domain
      // from: null, // we use a computed prop for this based on the period
      // to: null, // we use a computed prop for this based on the period

      // Scales
      previousX: null,
      previousY: null,
      x: null,
      y: null
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'tenants']),
    ...mapGetters('license', ['license']),
    teams() {
      return [
        { id: null, name: 'All' },
        ...this.tenants?.filter(t => t.license_id == this.license?.id)
      ]
    },
    multitenancy() {
      return this.license?.terms?.tenants > 1
    },
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
    // regressionItems() {
    //   // We do this to prevent modification of the original items array
    //   const items = Array.from(this.items, d => Object.assign({}, d))

    //   const lastIndex = items.length - 1
    //   const lastItem = items[lastIndex]
    //   const timestamp = new Date()
    //   const interpolatedRuns = Math.ceil(
    //     (lastItem.runs *
    //       daysInMonth(timestamp.getFullYear(), timestamp.getMonth())) /
    //       timestamp.getDate()
    //   )

    //   items[items.length - 1].runs = interpolatedRuns
    //   return items
    // },
    resizeChart: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawResizeChart)
      }, 300)
    },
    tooltipStyle() {
      if (!this.hovered) return
      return {
        left: `${this.hovered.x + this.hovered.bandwidth / 4}px`,
        top: `${this.hovered.y + this.padding.top + 35}px`
      }
    },
    updateChart: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawUpdateChart)
      }, 50)
    },
    updateItems: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawUpdateItems)
      }, 50)
    },
    updateScales: function() {
      return debounce(() => {
        requestAnimationFrame(this.rawUpdateScales)
      }, 50)
    },
    updateHovered: function() {
      return throttle(
        e => {
          requestAnimationFrame(() => {
            this.rawUpdateHovered(e)
          })
        },
        16,
        { leading: true, trailing: true }
      )
    },
    fromDisplay() {
      let format
      switch (this.period) {
        case 'Year':
          format = '%b %Y'
          break
        case 'Month':
          format = '%e %b %Y'
          break
        case 'Week':
          format = '%e %b'
          break
        default:
          break
      }
      return d3.timeFormat(format)(this.from)
    },
    toDisplay() {
      let format
      switch (this.period) {
        case 'Year':
          format = '%b %Y'
          break
        case 'Month':
          format = '%e %b %Y'
          break
        case 'Week':
          format = '%e %b'
          break
        default:
          break
      }
      return d3.timeFormat(format)(this.to)
    },
    from() {
      const from = new Date()

      if (this.period == 'Year') {
        const year = new Date().getFullYear()
        from.setFullYear(year - 1 + this.offset)
        from.setDate(0)
      } else if (this.period == 'Month') {
        from.setDate(1)
        from.setMonth(from.getMonth() + this.offset)
      } else if (this.period == 'Week') {
        const day = from.getDay()
        const diff = from.getDate() + this.offset - ((day + 6) % 7)
        from.setDate(diff)
      }

      from.setMilliseconds(0)
      from.setSeconds(0)
      from.setMinutes(0)
      from.setHours(0)
      return from
    },
    to() {
      const to = new Date()
      to.setHours(23)
      to.setSeconds(59)
      if (this.period == 'Year') {
        const year = new Date().getFullYear()
        to.setFullYear(year + this.offset)
        to.setMonth(to.getMonth() + 1)
        to.setDate(0)
        to.setMinutes(59)
      } else if (this.period == 'Month') {
        to.setMonth(to.getMonth() + 1 + this.offset)
        to.setDate(0)
        to.setMinutes(59)
      } else if (this.period == 'Week') {
        const day = to.getDay()
        const diff = to.getDate() + this.offset + (7 - day)
        to.setDate(diff)
      }

      to.setMilliseconds(999)
      to.setSeconds(59)
      to.setMinutes(59)
      to.setHours(23)
      return to
    },
    decrementOffsetDisabled() {
      return this.from <= startDate
    }
  },
  watch: {
    items() {
      // if (!this.chart) this.createChart()
      this.updateChart()
    },
    usage(val) {
      if (!val) return
      this.$apollo.queries['usage'].stop()
      this.updateItems()
      this.updateScales()
    },
    period() {
      this.offset = 0
      this.updateItems()
      this.updateScales()
    },
    offset() {
      this.updateItems()
      this.updateScales()
    },
    selectedTeam() {
      this.$apollo.queries['usage'].refresh()
    }
  },
  mounted() {
    setTimeout(() => {
      this.createChart()
    }, 1000)

    this.$apollo.queries['usage'].refetch()
  },
  updated() {
    if (!this.chart) this.createChart()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart)

    this.interactionGroup.on('mouseout', null)
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
      this.hoverGroup = this.chart.append('g').attr('class', 'hover-group')
      this.predictionGroup = this.chart
        .append('g')
        .attr('class', 'prediction-group')
      this.xAxisGroup = this.chart
        .append('g')
        .attr('class', 'usage-x-axis-group')
      this.yAxisGroup = this.chart
        .append('g')
        .attr('class', 'usage-y-axis-group')

      this.interactionGroup = this.chart
        .append('g')
        .attr('class', 'interaction-group')

      window.addEventListener('resize', this.resizeChart)

      this.rawResizeChart()
    },
    createX() {
      const x = d3.scaleTime()
      x.domain([this.from, this.to])
      x.range([this.padding.left * 2, this.width - this.padding.right * 2])

      return x
    },
    createY() {
      const y = d3.scaleLinear()
      y.domain([d3.max(this.items.map(d => d.runs)) || 10000, 0])
      y.range([this.padding.top, this.height - this.padding.y])

      return y
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

      this.width = parent.clientWidth - padding.left - padding.right

      this.height = parent.clientHeight - padding.top - padding.bottom

      this.chart.attr('viewbox', `0 0 ${this.width} ${this.height}`)

      if (!this.items.length) return

      this.updateScales()
      this.updateChart()
    },
    rawUpdateHovered(e) {
      const hoverline = e ? [e] : []

      const path = d =>
        `M0,${d.y + this.padding.top}L0,${this.height -
          this.padding.top -
          xAxisHeight / 2}`

      const cy = d => d.y + this.padding.top

      this.hoverGroup
        .selectAll('.hover-group')
        .data(hoverline, d => d.x)
        .join(
          enter => {
            const g = enter
              .append('g')
              .attr('class', 'hover-group')
              .attr('transform', d => `translate(${d.x})`)

            g.append('path')
              .attr('stroke', 'var(--v-primary-base')
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', 2.5)
              .attr('d', path)
              .style('pointer-events', 'none')
              .style('opacity', 0.3)

            g.append('circle')
              .attr('cy', cy)
              .attr('r', 5)
              .attr('fill', 'var(--v-accentPink-base)')
            return g
          },
          update => {
            update.attr('transform', d => `translate(${d.x})`)

            // update.select('path').attr('d', path)

            update.select('circle').attr('cy', cy)

            update
              .select('text')
              .attr('y', cy)
              .text(d => (d.runs ? d.runs.toLocaleString() : 0))

            return update
          },
          exit => exit.remove()
        )

      this.xAxisGroup
        .selectAll('.tick')
        .select('text')
        .attr('fill', '#9e9e9e')

      if (e) {
        this.xAxisGroup
          .selectAll('.tick')
          .filter(function() {
            const selection = d3.select(this)
            const transform = Math.floor(
              selection.attr('transform').replace(/[^\d.]/g, '')
            )
            const x = Math.floor(e.x)
            return transform - x <= 5 && transform - x >= -5
          })
          .select('text')
          .attr('fill', 'var(--v-primary-base')
      }
    },
    rawUpdateChart() {
      if (!this.chart) return
      const yOffset = this.height - this.padding.y

      const maxBandwidth =
        ((this.width - this.padding.left * 2 - this.padding.right * 2) /
          this.ticks) *
        0.8

      const bandwidth = maxBandwidth < 75 ? maxBandwidth : 75
      const bandwidthNoPadding =
        (this.width - this.padding.left * 2 - this.padding.right * 2) /
        this.ticks

      const xAxis = d3
        .axisBottom(this.x)
        .ticks(this.ticks)
        .tickSizeOuter(0)
        .tickFormat(date => {
          let formatted = d3.timeFormat(this.format)(date)

          if (this.period === 'Week') {
            formatted = formatted[0]
          }
          return formatted
        })

      const yAxis = d3
        .axisLeft(this.y)
        .tickSizeOuter(0)
        .tickSize(this.width - this.padding.x)

      this.xAxisGroup
        .style(
          'transform',
          `translate(0, ${this.height -
            this.padding.bottom +
            this.padding.bottom -
            25}px)`
        )
        .transition()
        .duration(1000)
        .ease(d3.easeQuad)
        .call(xAxis)

      this.yAxisGroup
        .transition()
        .duration(1000)
        .ease(d3.easeQuad)
        .style(
          'transform',
          `translate(${this.width - this.padding.left}px, ${
            this.padding.top
          }px)`
        )
        .call(yAxis)

      this.interactionGroup
        .selectAll('rect')
        .data(this.items, d => d.id)
        .join(
          enter =>
            enter
              .append('rect')
              .attr('width', bandwidthNoPadding < 0 ? 0 : bandwidthNoPadding)
              .attr('height', this.height)
              .attr(
                'x',
                d => this.x(new Date(d.timestamp)) - bandwidthNoPadding / 2
              )
              .attr('fill', 'transparent')
              .style('cursor', 'pointer')
              .on('mousemove', (e, d) => {
                if (!isNaN(d.runs)) {
                  const x = this.x(new Date(d.timestamp))
                  const y = this.y(d.runs)
                  const runs = d.runs ? d.runs.toLocaleString() : 0

                  this.hovered = {
                    x: x,
                    y: y,
                    runs: runs,
                    bandwidth: bandwidth
                  }

                  this.updateHovered(this.hovered)
                }
              }),
          update => {
            update
              .select('rect')
              .attr('width', bandwidthNoPadding < 0 ? 0 : bandwidthNoPadding)
              .attr(
                'x',
                d => this.x(new Date(d.timestamp)) - bandwidthNoPadding / 2
              )
              .on('mousemove', (e, d) => {
                if (!isNaN(d.runs)) {
                  const x = this.x(new Date(d.timestamp))
                  const y = this.y(d.runs)
                  const runs = d.runs ? d.runs.toLocaleString() : 0

                  this.hovered = {
                    x: x,
                    y: y,
                    runs: runs,
                    bandwidth: bandwidth
                  }

                  this.updateHovered(this.hovered)
                }
              })
          },
          exit =>
            exit
              .on('mouseout', null)
              .on('mouseover', null)
              .transition('exit')
              .remove()
        )

      this.interactionGroup.on('mouseout', () => {
        this.hovered = null
        this.updateHovered()
      })

      this.mainGroup
        .selectAll('path')
        .data([{ id: this.period, items: this.items }], d => d.id)
        .join(
          enter =>
            enter
              .append('path')
              .attr('stroke-width', 4.5)
              .attr(
                'stroke',
                this.showPath ? 'var(--v-primary-base)' : 'transparent'
              )
              .attr('fill', 'none')
              .call(enter =>
                enter
                  .transition()
                  .delay(1000)
                  .attr('d', d =>
                    this.line(
                      Array.from(d.items, d_ => {
                        return { ...d_, runs: !isNaN(d_.runs) ? 0 : undefined }
                      })
                    )
                  )
                  .transition()
                  .duration(1000)
                  .ease(d3.easeQuad)
                  .attr('d', d => this.line(d.items))
              ),
          update =>
            update.call(update =>
              update
                .transition()
                .duration(1000)
                .ease(d3.easeQuad)
                .attr(
                  'stroke',
                  this.showPath ? 'var(--v-primary-base)' : 'transparent'
                )
                .attr('d', d => this.line(d.items))
            ),
          exit =>
            exit.call(exit =>
              exit
                .transition()
                .duration(1000)
                .ease(d3.easeQuad)
                .attr('d', d =>
                  this.previousLine(
                    Array.from(d.items, d_ => {
                      return { ...d_, runs: !isNaN(d_.runs) ? 0 : undefined }
                    })
                  )
                )
                .transition()
                .duration(1000)
                .style('opacity', 0)
                .remove()
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
      const start = this.padding.left * 2
      const xPosition = (d, i) =>
        start + (bandwidthNoPadding * i - bandwidth / 2)
      const yPosition = d => (d.runs ? this.y(d.runs) : yOffset)
      const height = d => {
        const h = d.runs ? yOffset - this.y(d.runs) : 0
        return h >= 0 ? h : 0
      }

      // These are used for the text labels on the bars
      // which are unused at the moment
      // const transform = `translate(${bandwidth / 2 ?? 0}px)`
      // const textContent = d =>
      //   d.runs
      //     ? d.runs?.toLocaleString() +
      //       ' - ' +
      //       new Date(d.timestamp).toLocaleString('en-US', {
      //         dateStyle: 'short',
      //         timeStyle: undefined
      //       })
      //     : null

      this.mainGroup.style('transform', `translate(0, ${this.padding.top}px)`)

      // Bars
      this.mainGroup
        .selectAll('.bar-group')
        .data(this.items, d => d.id)
        .join(
          enter => {
            const g = enter
              .append('g')
              .attr('id', d => `bar-${d.id}-${this.period}`)
              .attr('class', 'bar-group')
              .attr('opacity', this.showBars ? 1 : 0)
              .on('mouseover', this.barMouseover)
              .on('mouseout', this.barMouseout)

            g.append('rect')
              .attr('class', 'bar')
              .attr('height', 0)
              .attr('width', bandwidth)
              .attr('fill', (d, i) =>
                i === 0 && this.ticks < this.items.length
                  ? 'url(#grad)'
                  : 'var(--v-primary-base)'
              )
              .attr('x', xPosition)
              .attr('y', yOffset)

            // g.append('text')
            //   .attr('x', xPosition)
            //   .attr('y', yOffset - 5)
            //   .style('text-anchor', 'middle')
            //   .style('user-select', 'none')
            //   .style('transform', transform)
            //   .style('font', '10px Roboto, sans-serif')
            //   .attr('fill', 'transparent')
            //   .text(textContent)

            return g.call(enter => {
              enter
                .select('rect')
                .transition('enter')
                .duration(1000)
                .delay(250)
                .ease(d3.easeQuad)
                .attr('height', height)
                .attr('y', yPosition)

              // enter
              //   .select('text')
              //   .transition('enter')
              //   .duration(1000)
              //   .delay(250)
              //   .ease(d3.easeQuad)
              //   .attr('y', d =>
              //     d.runs ? yPosition(d) - 5 : yOffset + this.padding.y
              //   )
              //   .style('font', '10px Roboto, sans-serif')
              //   .attr('fill', this.showText ? '#546E7A' : 'transparent')

              return enter
            })
          },
          update => {
            return update.call(update => {
              update
                .transition('update')
                .duration(1000)
                .ease(d3.easeQuad)
                .attr('opacity', this.showBars ? 1 : 0)

              update
                .select('rect')
                .transition('update')
                .duration(1000)
                .ease(d3.easeQuad)
                .attr('height', height)
                .attr('y', yPosition)
                .attr('width', bandwidth)
                .attr('x', xPosition)

              // update
              //   .select('text')
              //   .transition('update')
              //   .duration(1000)
              //   .delay(500)
              //   .ease(d3.easeQuad)
              //   .attr('fill', this.showText ? '#546E7A' : 'transparent')
              //   .attr('y', d =>
              //     d.runs ? yPosition(d) - 5 : yOffset + this.padding.y
              //   )
              //   .attr('x', xPosition)
            })
          },
          exit =>
            exit.call(exit => {
              exit
                .select('rect')
                .transition('exit')
                .duration(250)
                .ease(d3.easeQuad)
                .attr('height', 0)
                .attr('y', yOffset)

              exit
                .select('text')
                .transition('exit')
                .duration(250)
                .ease(d3.easeQuad)
                .attr('y', yOffset - 5)

              return exit.call(exit =>
                exit
                  .on('click', null)
                  .on('mouseout', null)
                  .on('mouseover', null)
                  .transition('exit')
                  // .delay(250)
                  .remove()
              )
            })
        )
    },
    rawUpdateItems() {
      const now = new Date()
      now.setMinutes(59)
      now.setHours(23)

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

      this.items = this.usage
        .filter(d => {
          if (d.kind !== 'USAGE') return

          const date = new Date(d.timestamp)
          return date >= this.from && date <= this.to
        })
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
              id: date.toISOString() + '-' + this.period,
              timestamp: date.toISOString(),
              runs: date > now ? undefined : 0
            }
          })
        )
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    },
    rawUpdateScales() {
      const x = this.createX()
      this.previousX = this.x
      this.x = x

      const y = this.createY()
      this.previousY = this.y
      this.y = y

      this.line = d3
        .line()
        .curve(d3.curveMonotoneX)
        .defined(d => !isNaN(d.runs)) // Use this to create gaps in data
        .x(d => this.x(new Date(d.timestamp)) ?? 0)
        .y(
          d => this.height - this.padding.y + (this.y(d.runs) - this.y(0)) || 0
        )

      this.previousLine = d3
        .line()
        .curve(d3.curveMonotoneX)
        .defined(d => !isNaN(d.runs)) // Use this to create gaps in data
        .x(d => this.previousX(new Date(d.timestamp)) ?? 0)
        .y(
          d =>
            this.height -
              this.padding.y +
              (this.previousY(d.runs) - this.previousY(0)) || 0
        )

      // this.regression = d3
      //   .regressionLinear()
      //   .x(d => this.x(new Date(d.timestamp)))
      //   .y(d => d.runs)(this.regressionItems)

      // this.predict = this.regression.predict

      switch (this.period) {
        case 'Year':
          this.ticks = 13
          this.format = '%b'
          break
        case 'Month':
          this.ticks = 31
          this.format = '%e'
          break
        case 'Week':
          this.ticks = 7
          this.format = '%a'
          break
        default:
          break
      }
    },
    decrementOffset() {
      switch (this.period) {
        case 'Year':
        case 'Month':
          this.offset -= 1
          break
        case 'Week':
          this.offset -= 7
          break
        default:
          break
      }
    },
    incrementOffset() {
      switch (this.period) {
        case 'Year':
        case 'Month':
          this.offset += 1
          break
        case 'Week':
          this.offset += 7
          break
        default:
          break
      }
    }
  },
  apollo: {
    usage: {
      query: require('@/graphql/TeamSettings/usage.gql'),
      variables() {
        return { from: startDate, to: this.to, tenant_id: this.selectedTeam }
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
  <v-card class="position-relative py-2 h-100" tile fluid>
    <div
      class="d-flex align-center justify-space-between py-2 ml-n2 px-5 card-title"
    >
      <div class="d-flex">
        <div class="text-h4 font-weight-light">
          Usage
        </div>

        <div>
          <v-select
            v-if="multitenancy"
            v-model="selectedTeam"
            dense
            hide-details
            outlined
            style="width: 200px;"
            class="ml-6"
            single-line
            :items="teams"
            item-value="id"
          >
            <template #item="{ item }">
              <div class="text-subtitle-2 font-weight-light">
                {{ item.name }}
              </div>
            </template>
            <template #selection="{ item }">
              <div class="text-subtitle-2 font-weight-light text-truncate">
                {{ item.name }}
              </div>
            </template>
          </v-select>
        </div>
      </div>

      <div
        v-if="$vuetify.breakpoint.smAndUp"
        class="font-weight-light d-flex align-center justify-center"
        :class="{ 'text-caption': $vuetify.breakpoint.smOnly }"
      >
        <v-btn
          :disabled="decrementOffsetDisabled"
          icon
          depressed
          small
          @click="decrementOffset"
        >
          <v-icon>chevron_left</v-icon>
        </v-btn>

        <span class="mx-2"> {{ fromDisplay }} - {{ toDisplay }} </span>

        <v-btn
          :disabled="offset === 0"
          icon
          depressed
          small
          @click="incrementOffset"
        >
          <v-icon>chevron_right</v-icon>
        </v-btn>

        <v-btn
          :disabled="offset === 0"
          icon
          depressed
          small
          @click="offset = 0"
        >
          <v-icon>last_page</v-icon>
        </v-btn>
      </div>

      <div>
        <span
          class="cursor-pointer px-4 text-title d-inline-flex align-center justify-center"
          :class="
            period == 'Week'
              ? 'blue-grey--text'
              : 'blue-grey--text text--lighten-4'
          "
          @click="period = 'Week'"
        >
          <v-icon
            x-small
            class="mr-2"
            :color="period == 'Week' ? 'primary' : 'grey lighten-2'"
          >
            fiber_manual_record
          </v-icon>
          Week
        </span>
        <span
          class="cursor-pointer px-4 text-title d-inline-flex align-center justify-center"
          :class="
            period == 'Month'
              ? 'blue-grey--text'
              : 'blue-grey--text text--lighten-4'
          "
          @click="period = 'Month'"
        >
          <v-icon
            x-small
            class="mr-2"
            :color="period == 'Month' ? 'primary' : 'grey lighten-2'"
          >
            fiber_manual_record
          </v-icon>
          Month
        </span>
        <span
          class="cursor-pointer px-4 text-title d-inline-flex align-center justify-center"
          :class="
            period == 'Year'
              ? 'blue-grey--text'
              : 'blue-grey--text text--lighten-4'
          "
          @click="period = 'Year'"
        >
          <v-icon
            x-small
            class="mr-2"
            :color="period == 'Year' ? 'primary' : 'grey lighten-2'"
          >
            fiber_manual_record
          </v-icon>
          Year
        </span>
      </div>
    </div>

    <v-card-text ref="parent" class="chart-container pt-16 pr-8">
      <svg :id="`${id}-svg`" class="svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop
              offset="0%"
              style="
                stop-color: rgb(39, 177, 255);
                stop-opacity: 0;
              "
            />
            <stop
              offset="100%"
              style="
                stop-color: rgb(39, 177, 255);
                stop-opacity: 0.25;
              "
            />
          </linearGradient>
        </defs>
      </svg>
    </v-card-text>

    <div
      v-if="hovered"
      class="tooltip v-tooltip__content rounded"
      :style="tooltipStyle"
    >
      {{ hovered.runs }} runs
    </div>
  </v-card>
</template>

<style lang="scss" scoped>
.h-100 {
  height: 100%;
}

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
  position: absolute;
  width: 100%;
  z-index: 1;
}

.tooltip {
  pointer-events: none;
  position: absolute;
  text-overflow: initial;
  transform: translate(-50%);
  transition: all 50ms;
  user-select: none;
  z-index: 4;
}
</style>

<style lang="scss">
// We use unscoped css here
// so that we don't need to do a post-selection
// on the axis
.usage-x-axis-group {
  color: #9e9e9e !important;
  font: 16px Roboto, sans-serif;
  opacity: 0.8;
  user-select: none;

  @media screen and (max-width: 1440px) {
    font: 12px Roboto, sans-serif;
  }

  @media screen and (max-width: 1200px) {
    font: 10px Roboto, sans-serif;
  }

  @media screen and (max-width: 800px) {
    font: 8px Roboto, sans-serif;
  }

  .domain {
    opacity: 0;
    stroke: rgba(0, 0, 0, 0.12);
    stroke-width: 1.65px;
  }

  .tick line {
    opacity: 0;
  }
}

.usage-y-axis-group {
  color: #9e9e9e !important;
  font: 12px Roboto, sans-serif;
  opacity: 0.8;
  text-anchor: start;
  user-select: none;

  .domain {
    opacity: 0;
  }

  .tick:nth-child(odd) {
    opacity: 0;
  }

  .tick line {
    stroke: rgba(0, 0, 0, 0.05);
    stroke-dasharray: 10, 10;
    stroke-width: 1.65px;
    transform: translate(50px);
  }

  .tick:last-of-type line {
    opacity: 0;
  }
}

.theme--dark .usage-y-axis-group {
  /* stylelint-disable-next-line */
  .tick line {
    stroke: rgba(255, 255, 255, 0.05);
  }
}
</style>
