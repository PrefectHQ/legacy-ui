import { mapGetters } from 'vuex'
import moment from 'moment'

export const flowRunHistoryMixin = {
  data() {
    return {
      flowRuns: [],
      scheduledFlowRuns: [],
      tooltip: null,
      tooltipLoading: false,
      unwatchFlowRuns: null
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    ...mapGetters('tenant', ['tenant']),
    breaklines() {
      if (this.reversedRuns.length <= 0) return []
      let breaklines = []

      let cutoff = null,
        index = 0
      this.reversedRuns.forEach((d, i) => {
        let future =
          d.state == 'Scheduled'
            ? this.getTimeDiff(d.scheduled_start_time)._milliseconds <= 0
            : null

        if (future && !cutoff) {
          cutoff = d.id
          index = i
        }
      })
      let anchor =
        index > 4 && index < 98 ? 'middle' : index < 98 ? 'start' : 'end'

      if (cutoff)
        breaklines.push({
          label: '(now)',
          value: cutoff,
          anchor: anchor
        })

      if (!cutoff) {
        let lastIndex = this.reversedRuns.length - 1
        breaklines.push({
          label: this.getTimeFrom(
            this.reversedRuns[lastIndex].start_time ||
              this.reversedRuns[lastIndex].scheduled_start_time
          ),
          value: this.reversedRuns[lastIndex].id,
          after: true,
          anchor: lastIndex > 98 ? 'end' : 'middle'
        })

        if (this.reversedRuns.length > 4) {
          breaklines.push({
            label: this.getTimeFrom(
              this.reversedRuns[0].start_time ||
                this.reversedRuns[0].scheduled_start_time
            ),
            value: this.reversedRuns[0].id,
            anchor: 'start'
          })
        }
      } else if (this.reversedRuns.length > 4) {
        breaklines.push({
          label: this.getTimeFrom(
            this.reversedRuns[0].start_time ||
              this.reversedRuns[0].scheduled_start_time
          ),
          value: this.reversedRuns[0].id,
          anchor: 'start'
        })
      }

      return breaklines
    },
    canShowTooltip() {
      return (
        this.tooltip &&
        this.reversedRuns.find(f => f.id == this.tooltip.data.id)
      )
    },
    reversedRuns() {
      let runs = [...this.scheduledFlowRuns, ...this.flowRuns]

      const computedStyle = getComputedStyle(document.documentElement)

      const notPastRunStates = [
        'Running',
        'Scheduled',
        'Queued',
        'Paused',
        'Submitted'
      ]

      runs.forEach(d => {
        let future = this.getTimeDiff(d.scheduled_start_time)._milliseconds

        if (d.start_time && d.end_time) {
          let end = new Date(d.end_time),
            start = new Date(d.start_time)
          d.duration = end - start
        } else if (d.start_time && notPastRunStates.includes(d.state)) {
          let now = new Date(),
            start = new Date(d.start_time)
          d.duration = now - start
        }

        // We add a filler end_time for instances where a finished
        // state has been set but the PG trigger to populate end_time
        // hasn't run yet
        if (
          !d.end_time &&
          d.start_time &&
          !notPastRunStates.includes(d.state) &&
          d.state !== 'Skipped'
        ) {
          d.end_time = new Date()
        }

        d.finished = !notPastRunStates.includes(d.state)

        // We do the same for running flows without start_time
        if (!d.start_time && d.state == 'Running') {
          d.start_time = new Date()
        }

        d.ignore = d.state == 'Scheduled'

        d.color = computedStyle?.getPropertyValue(`--v-${d.state}-base`)

        d.usePattern = d.state == 'Scheduled' && future <= 0

        d.warningOpacity =
          d.state !== 'Scheduled' || d.start_time || future <= 10000 ? 0 : 1
      })

      const pastRuns = runs
        .filter(r => !notPastRunStates.includes(r.state))
        .sort(this.sortTime('end_time', 'scheduled_start_time'))

      const currentRuns = runs
        .filter(r => r.state == 'Running' || r.state == 'Paused')
        .sort(this.sortTime('start_time'))

      const futureRuns = runs
        .filter(r => r.state == 'Scheduled')
        .sort(this.sortTime('scheduled_start_time'))

      const queuedRuns = runs
        .filter(r => r.state == 'Queued' || r.state == 'Submitted')
        .sort(this.sortTime('scheduled_start_time'))

      // We have to sort again because the server-side sorting
      // is unstable
      const toReturn = [
        ...pastRuns,
        ...currentRuns,
        ...queuedRuns,
        ...futureRuns
      ]

      return toReturn
    }
  },
  methods: {
    _barMouseout() {
      this.setTooltip(null)
      this.tooltipLoading = false
    },
    async _barMouseover(tooltipData) {
      this.setTooltip(tooltipData)
      this.checkFormatTime(tooltipData, 'end_time')
      this.checkFormatTime(tooltipData, 'start_time')
      this.checkFormatTime(tooltipData, 'scheduled_start_time')

      tooltipData.status_style = this.statusStyle(tooltipData.data.state)

      const flowId = tooltipData.data.flow_id
      if (!flowId) {
        this.setTooltip(tooltipData)
        return
      }

      try {
        this.tooltipLoading = true

        const { data } = await this.$apollo.query({
          query: require('@/graphql/Dashboard/timeline-flow.gql'),
          variables: { flowId }
        })

        tooltipData.data.flow = data.flow_by_pk
      } finally {
        this.tooltipLoading = false

        // We check this to make sure we're not showing the tooltip
        // when _barMouseout has already run or a different
        // bar has been hovered
        if (this.tooltip && this.tooltip.data.flow_id == flowId)
          this.setTooltip(tooltipData)
      }
    },
    _barClick(d) {
      this.$router.push({
        name: 'flow-run',
        params: {
          id: d.id,
          tenant: this.tenant?.slug
        }
      })
    },
    formatTime(timestamp) {
      if (!timestamp) throw new Error('Did not receive a timestamp')

      let t = moment(timestamp).tz(this.timezone),
        shortenedTz = moment()
          .tz(this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
          .zoneAbbr()

      let timeObj = t ? t : moment(timestamp)

      let formatted = timeObj.calendar(null, {
        sameDay: 'h:mma',
        sameElse: 'MMMM D, YYYY [at] h:mma'
      })
      return `${formatted} ${shortenedTz}`
    },
    getTimeDiff(time) {
      let now, start
      if (this.timezone) {
        now = new moment().tz(this.timezone)
        start = moment(time).tz(this.timezone)
      } else {
        now = new moment()
        start = moment(time)
      }
      let diff = moment.duration(now.diff(start))

      return diff
    },
    getTimeFrom(time) {
      let now, _time
      if (this.timezone) {
        now = new moment().tz(this.timezone)
        _time = moment(time).tz(this.timezone)
      } else {
        now = new moment()
        _time = moment(time)
      }

      return _time.from(now)
    },
    sortTime(ref, secondaryRef) {
      return function(a, b) {
        return (
          new Date(a[ref] || a[secondaryRef]) -
          new Date(b[ref] || b[secondaryRef])
        )
      }
    },
    statusStyle(state) {
      return {
        'border-radius': '50%',
        display: 'inline-block',
        'background-color': `var(--v-${state}-base)`,
        height: '1rem',
        width: '1rem'
      }
    },
    setTooltip(tooltip) {
      if (this.unwatchFlowRuns) {
        this.unwatchFlowRuns()
      }

      if (tooltip) {
        this.unwatchFlowRuns = this.$watch(
          'flowRuns',
          this.validateTooltipIdStillPresent
        )
      }

      this.tooltip = tooltip
    },
    validateTooltipIdStillPresent() {
      const exists = this.flowRuns.some(f => f.id == this.tooltip.data.id)

      if (!exists) {
        this.setTooltip(null)
      }
    },
    checkFormatTime(tooltipData, property) {
      if (tooltipData.data[property]) {
        const formatted = this.formatTime(tooltipData.data[property])

        tooltipData.data[`display_${property}`] = formatted
      }
    }
  }
}
