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
      start: null,
      table: 'user',
      tableOptions: [
        { text: 'Team', value: 'tenant' },
        { text: 'User', value: 'user' },
        { text: 'Flow', value: 'flow' },
        { text: 'Flow fun', value: 'flow_run' },
        { text: 'Task', value: 'task' },
        { text: 'Task run', value: 'task_run' }
      ]
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

    this.$watch(
      'table',
      val => {
        this.filter.object_table = { _eq: val }

        this.$emit('input', { ...this.filter })
      },
      {
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

    <v-select
      v-model="table"
      outlined
      label="Type"
      :items="tableOptions"
      dense
      hide-details
    />
  </div>
</template>

<style lang="scss">
/*  */
</style>
