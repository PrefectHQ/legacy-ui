<script>
import DateTimePicker from '@/components/DateTimePicker'

export default {
  components: {
    DateTimePicker
  },
  data() {
    return {
      end: null,
      start: null
    }
  },
  mounted() {
    const start = new Date()
    const end = new Date()
    start.setHours(0)
    start.setMinutes(0)
    start.setSeconds(0)
    start.setMilliseconds(0)

    end.setHours(23)
    end.setMinutes(59)
    end.setSeconds(59)
    end.setMilliseconds(999)

    this.start = start
    this.end = end
  }
}
</script>

<template>
  <div class="d-flex align-middle justify-end">
    <DateTimePicker
      v-if="start"
      v-model="start"
      label="Start date"
      icon="today"
    />
    <DateTimePicker v-if="end" v-model="end" label="End date" icon="event" />
  </div>
</template>

<style lang="scss">
/*  */
</style>
