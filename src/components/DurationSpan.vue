<script>
import { durationDifference } from '@/utils/dateTime'
import { getMillisecondsUntilNextMinute } from '@/utils/dateTime'

export default {
  props: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      duration: null,
      interval: null
    }
  },
  watch: {
    endTime() {
      this.updateDuration()
      this.triggerUpdateDurationIntervalAtNextMinute()
    }
  },
  mounted() {
    this.updateDuration()
    this.triggerUpdateDurationIntervalAtNextMinute()
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    updateDuration() {
      this.duration = durationDifference(
        new Date(this.startTime),
        this.endTime ? new Date(this.endTime) : new Date()
      )
    },
    triggerUpdateDurationIntervalAtNextMinute() {
      clearInterval(this.interval)
      const millisecondsUntilNextMinute = getMillisecondsUntilNextMinute()

      this.interval = setTimeout(
        this.updateDurationOnMinuteInterval,
        millisecondsUntilNextMinute
      )
    },
    updateDurationOnMinuteInterval() {
      this.updateDuration()
      this.interval = setInterval(this.updateDuration, 60000)
    },
    plural(word, count) {
      return count == 1 ? word : `${word}s`
    }
  }
}
</script>

<template>
  <span class="duration-span">
    <span class="duration-span__days"
      >{{ duration.days }} {{ plural('day', duration.days.length) }}</span
    >
    <span class="duration-span__hours"
      >{{ duration.hours }} {{ plural('hour', duration.hours.length) }}</span
    >
    <span class="duration-span__minutes"
      >{{ duration.minutes }}
      {{ plural('minute', duration.minutes.length) }}</span
    >
  </span>
</template>

<style lang="scss" scoped>
.duration-span__days,
.duration-span__hours {
  margin-right: 2px;

  &::after {
    content: ',';
  }
}
</style>
