<script>
import DateTimePicker from '@/components/DateTimePicker'

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
      logLevel: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'],
      logLevelOptions: logLevels,
      table: 'user',
      tableOptions: [
        { text: 'Account', value: 'license' },
        { text: 'Flow', value: 'flow' },
        { text: 'Team', value: 'tenant' },
        { text: 'User', value: 'user' }
        // I don't think we'll be populating these yet for this table
        // { text: 'Flow run', value: 'flow_run' },
        // { text: 'Task', value: 'task' },
        // { text: 'Task run', value: 'task_run' }
      ],
      textSearch: null,
      previousSearch: null
    }
  },
  computed: {
    searchDisabled() {
      return this.textSearch == this.previousSearch
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
  },
  methods: {
    updateTextSearch() {
      if (this.searchDisabled) return

      // Performing this check lets us make a more efficient query
      if (this.textSearch) {
        this.filter.message = { _ilike: `%${this.textSearch}%` }
      } else {
        delete this.filter.message
      }

      this.previousSearch = this.textSearch

      this.$emit('input', { ...this.filter })
    },
    updateLogLevel() {
      if (this.logLevel.length === 1) {
        this.filter.level = { _eq: this.logLevel[0] }
      } else {
        this.filter.level = { _in: this.logLevel }
      }

      this.$emit('input', { ...this.filter })
    }
  }
}
</script>

<template>
  <div class="d-flex align-middle justify-end pa-4">
    <div
      class="mr-auto d-flex align-center justify-center"
      style="max-width: 350px;"
    >
      <v-text-field
        v-model="textSearch"
        label="Search"
        outlined
        hide-details
        dense
        append-icon="search"
        clearable
        @keyup.enter="updateTextSearch"
      />
      <v-btn
        class="ml-2"
        color="primary"
        depressed
        small
        :disabled="searchDisabled"
        @click="updateTextSearch"
      >
        Search
      </v-btn>
    </div>

    <div class="mr-4" style="max-width: 200px;">
      <v-select
        v-model="table"
        outlined
        label="Type"
        :items="tableOptions"
        dense
        hide-details
      />
    </div>

    <div class="mr-4" style="max-width: 300px;">
      <v-select
        v-model="logLevel"
        outlined
        label="Level"
        :items="logLevelOptions"
        dense
        offset-y
        multiple
        menu-props="auto, offsetY"
        hide-details
        style="width: 300px;"
        @blur="updateLogLevel"
      >
        <template #item="{ item, attrs }">
          <v-chip
            :color="attrs.inputValue ? item.color : 'grey'"
            small
            :outlined="!attrs.inputValue"
          >
            <v-icon :color="attrs.inputValue ? 'white' : item.color" small>
              {{ item.icon }}
            </v-icon>
            <span class="ml-1" :class="{ 'white--text': attrs.inputValue }">{{
              item.text
            }}</span>
          </v-chip>
        </template>

        <template #selection="{ item, index }">
          <v-chip v-if="index < 2" :color="item.color" small>
            <v-icon color="white" small>
              {{ item.icon }}
            </v-icon>
            <span class="white--text ml-1">{{ item.text }}</span>
          </v-chip>

          <span v-if="index === 2" class="utilGrayDark--text text-caption">
            (+{{ logLevel.length - 2 }} other{{
              logLevel.length - 2 == 1 ? '' : 's'
            }})
          </span>
        </template>
      </v-select>
    </div>

    <div class="d-inline-flex align-center justify-center">
      <div class="mr-4">
        <DateTimePicker
          v-if="start"
          v-model="start"
          label="Start date"
          icon="today"
        />
      </div>
      <DateTimePicker v-if="end" v-model="end" label="End date" icon="event" />
    </div>
  </div>
</template>

<style lang="scss">
/*  */
</style>
