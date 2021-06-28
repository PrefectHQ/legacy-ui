<script>
import DateTimePicker from '@/components/DateTimePicker'

export default {
  components: {
    DateTimePicker
  },
  props: {
    value: {
      type: Object,
      required: false,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      filter: { ...this.value },
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

    this.$watch(
      vm => [vm.start, vm.end],
      val => {
        const [start, end] = val
        this.filter.timestamp = { _gte: start, _lte: end }

        this.$emit('input', { ...this.filter })
      },
      {
        deep: true,
        immediate: true
      }
    )
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
