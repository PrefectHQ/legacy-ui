<script>
import { formatTime } from '@/mixins/formatTimeMixin'
const objectTables = [
  {
    text: 'Account',
    value: 'billing.license'
  },
  {
    text: 'Flow',
    value: 'flow'
  },
  {
    text: 'User',
    value: 'user'
  },
  { text: 'Team', value: 'tenant' }
  // {
  //   text: 'Flow run',
  //   value: null
  // }
  // { text: 'Task', value: 'task' },
  // { text: 'Task run', value: 'task_run' }
]

const logLevels = [
  {
    text: 'Critical',
    color: '#d50000',
    icon: 'warning',
    value: 'CRITICAL'
  },
  {
    text: 'Error',
    color: '#ff5252',
    icon: 'warning_amber',
    value: 'ERROR'
  },
  {
    text: 'Debug',
    color: '#937eff',
    icon: 'bug_report',
    value: 'DEBUG'
  },
  {
    text: 'Warn',
    color: '#ffdd37',
    icon: 'report_problem',
    value: 'WARN'
  },
  {
    text: 'Info',
    color: '#2196f3',
    icon: 'info',
    value: 'INFO'
  }
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
    },
    logLevels() {
      return logLevels.filter(
        l =>
          this.filter?.level._in?.includes(l.value) ||
          this.filter?.level?._eq == l.value
      )
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

    <!-- We don't need to display these because they're all enabled by default -->
    <!-- <span v-if="filter.level" class="ml-2">
      <span class="mr-1">Log levels:</span>
      <v-chip
        v-for="level in logLevels"
        :key="level.value"
        :color="level.color"
        small
        class="ml-1"
      >
        <v-icon color="white" small>
          {{ level.icon }}
        </v-icon>
        <span class="ml-1 white--text">
          {{ level.text }}
        </span>
      </v-chip>
    </span> -->
  </div>
</template>

<style lang="scss" scoped>
/* // */
</style>
