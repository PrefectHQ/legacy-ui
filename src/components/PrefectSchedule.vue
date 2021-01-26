<script>
import { intervalToEnglish } from '@/utils/dateTime'
import cronstrue from 'cronstrue'
import moment from 'moment-timezone'
import { mapGetters } from 'vuex'

// TODO add button that opens a sidebar to show multiple schedules (#307)

export default {
  props: {
    schedule: {
      required: true,
      type: Object,
      validator: schedule => schedule.type
    },
    scheduledStartTime: {
      required: false,
      type: Array,
      default: () => null
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    displaySchedule() {
      if (this.schedule.clocks[0].type === 'CronClock') {
        let display = ''

        let scheduled_start_time = moment(
          this.scheduledStartTime[0].scheduled_start_time
        )
          .tz(this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
          .format('h:mm A')
        let scheduled_start_time_tz = moment(
          this.scheduledStartTime[0].scheduled_start_time
        )
          .tz(this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
          .zoneAbbr()
        if (cronstrue.toString(this.schedule.clocks[0].cron).length > 24) {
          display = `${cronstrue.toString(this.schedule.clocks[0].cron)} (${
            this.schedule.clocks[0].start_date.tz
          })`
        } else {
          display = `At ${scheduled_start_time} (${scheduled_start_time_tz})`
        }

        return display
      } else if (this.schedule.clocks[0].type === 'IntervalClock') {
        const microsecondsString = this.schedule.clocks[0].interval
        const numberOfMilliseconds = Number(microsecondsString) * 0.001

        return intervalToEnglish(numberOfMilliseconds)
      }
      return null
    }
  }
}
</script>

<template>
  <span v-if="schedule.clocks ? schedule.clocks.length == 1 : false">
    {{ displaySchedule }}
  </span>
  <span v-else>
    <v-btn disabled small>{{
      schedule.type === 'UnionSchedule' ? 'union schedule' : 'custom schedule'
    }}</v-btn>
  </span>
</template>
