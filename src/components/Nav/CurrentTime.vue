<template>
  <div>
    {{ hours }}
    <span class="utilGrayDark--text">:</span>
    {{ minutes }}
    <span class="text-overline utilGrayDark--text">
      {{ meridian }}
    </span>
    <v-tooltip top>
      <template #activator="{ on }">
        <v-icon class="material-icons-outlined" x-small v-on="on">
          info
        </v-icon>
      </template>
      System time according to your set Timezone; you can change this from your
      Account Settings.
    </v-tooltip>
  </div>
</template>

<script>
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  mixins: [formatTime],
  data() {
    return {
      clockTimeout: null,
      clockInterval: null,
      time: null
    }
  },
  computed: {
    hours() {
      return this.time?.hours > 12 ? this.time.hours % 12 : this.time.hours
    },
    minutes() {
      return this.time?.minutes
    },
    meridian() {
      return this.time?.hours > 12 ? 'PM' : 'AM'
    }
  },
  created() {
    this.setTime()
    this.triggetSetTimeIntervalAtNextMinute()
  },
  destroyed() {
    clearInterval(this.clockInterval)
  },
  methods: {
    setTime() {
      this.time = this.dateParts(Date.now())
    },
    triggetSetTimeIntervalAtNextMinute() {
      const millisecondsUntilNextMinute = this.getMillisecondsUntilNextMinute()

      this.clockInterval = setTimeout(
        this.setTimeOnMinuteInterval,
        millisecondsUntilNextMinute
      )
    },
    setTimeOnMinuteInterval() {
      this.setTime()
      this.clockInterval = setInterval(this.setTime, 60000)
    },
    getMillisecondsUntilNextMinute() {
      return 60000 - this.time.seconds * 1000 + this.time.milliseconds
    }
  }
}
</script>
