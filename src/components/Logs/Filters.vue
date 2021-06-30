<script>
import { formatTime } from '@/mixins/formatTimeMixin'
const objectTables = [
  {
    text: 'Account',
    value: 'billing.license',
    subtext: 'Account, license, and usage-related logs'
  },
  {
    text: 'Flow',
    value: 'flow',
    subtext: 'Flow-related logs, including schedules and flow settings updates'
  },
  {
    text: 'User',
    value: 'user',
    subtext: 'Login, role, and membership-related logs'
  },
  { text: 'Team', value: 'tenant', subtext: 'Team-related logs' }
  // I don't think we'll be populating these yet for this table
  // {
  //   text: 'Flow run',
  //   value: null,
  //   subtext: 'Logs generated when running flows'
  // }
  // { text: 'Task', value: 'task' },
  // { text: 'Task run', value: 'task_run' }
]

export default {
  mixins: [formatTime],
  props: {
    filter: {
      type: Object,
      required: false,
      default() {
        return {}
      }
    }
  },
  data() {
    return {}
  },
  computed: {
    objectTableDisplay() {
      return objectTables.find(t => t.value == this.filter?.object_table?._eq)
        ?.text
    },
    startTimestampDisplay() {
      return this.formatTime(this.filter?.timestamp?._gte)
    },
    endTimestampDisplay() {
      return this.formatTime(this.filter?.timestamp?._lte)
    }
  },
  methods: {
    handleClickFilter() {
      this.$emit('filter-click')
    }
  }
}
</script>

<template>
  <div
    v-if="filter"
    class="d-flex align-center justify-start"
    @click="handleClickFilter"
  >
    <span class="mr-2">Filters:</span>
    <v-chip v-if="filter.object_table" class="font-weight-light" small>
      Type:
      <span class="font-weight-medium ml-1">{{ objectTableDisplay }}</span>
    </v-chip>

    <span v-if="filter.timestamp" class="font-weight-light ml-1">
      <v-chip small>
        Start:
        <span class="font-weight-medium ml-1">{{ startTimestampDisplay }}</span>
      </v-chip>

      <v-chip class="ml-1" small>
        End:
        <span class="font-weight-medium ml-1">{{ endTimestampDisplay }}</span>
      </v-chip>
    </span>
  </div>
</template>

<style lang="scss" scoped>
/* // */
</style>
