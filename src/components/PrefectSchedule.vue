<script>
import { intervalToEnglish } from '@/utils/dateTime'
import cronstrue from 'cronstrue'

// TODO add button that opens a sidebar to show multiple schedules (#307)

export default {
  props: {
    schedule: {
      required: true,
      type: Object,
      validator: schedule => schedule.type
    }
  },
  computed: {
    displaySchedule() {
      if (this.schedule.clocks[0].type === 'CronClock') {
        // If there's a start date and a timezone, add a space and show it
        const timeZone =
          this.schedule.start_date && this.schedule.start_date.tz
            ? ` ${this.schedule.start_date.tz}`
            : ''
        return `${cronstrue.toString(this.schedule.clocks[0].cron)}${timeZone}`
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
