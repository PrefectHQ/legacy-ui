<script>
import moment from 'moment-timezone'

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
    }
  },
  mounted() {
    this.updateDuration()
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    updateDuration() {
      clearInterval(this.interval)
      if (!this.endTime) {
        let now = new moment(),
          start = new moment(this.startTime)
        this.duration = moment.duration(now.diff(start))

        this.interval = setInterval(() => {
          let now = new moment(),
            start = new moment(this.startTime)
          this.duration = moment.duration(now.diff(start))
        }, 1000)
      } else {
        let end = new moment(this.endTime),
          start = new moment(this.startTime)
        this.duration = moment.duration(end.diff(start))
      }
    }
  }
}
</script>

<template>
  <span>{{ duration | duration }}</span>
</template>
