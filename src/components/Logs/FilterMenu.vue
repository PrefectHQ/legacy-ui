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
    },
    buttonClass: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      applyDisabled: true,
      filter: { ...this.value },
      end: null,
      start: null,
      logLevel: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'],
      logLevelOptions: logLevels,
      menu: false,
      table: 'user',
      tableOptions: [
        {
          text: 'Account',
          value: 'billing.license',
          subtext: 'Account, license, and usage-related logs'
        },
        {
          text: 'Flow',
          value: 'flow',
          subtext:
            'Flow-related logs, including schedules and flow settings updates'
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
    this.initializeStartAndEnd()

    this.$watch(
      vm => [vm.start, vm.end],
      val => {
        const [start, end] = val
        this.filter.timestamp = { _gte: start, _lte: end }
        this.filter = { ...this.filter }
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
        this.filter = { ...this.filter }
      },
      {
        immediate: true
      }
    )

    this.$watch(
      vm => [vm.value, vm.filter],
      val => {
        const [value, filter] = val
        this.applyDisabled = JSON.stringify(value) === JSON.stringify(filter)
      },
      {
        deep: true
      }
    )

    this.filter.level = { _in: this.logLevel }

    this.applyChanges()
  },
  methods: {
    applyChanges() {
      this.$emit('input', { ...this.filter })
    },
    resetChanges() {
      this.initializeStartAndEnd()
      this.table = 'user'
      this.logLevel = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']
      this.textSearch = null
      this.previousSearch = null
    },
    initializeStartAndEnd() {
      const start = new Date()
      const end = new Date()

      start.setMonth(1)
      start.setDate(1)

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
    },
    updateTextSearch() {
      if (this.searchDisabled) return

      // Performing this check lets us make a more efficient query
      if (this.textSearch) {
        this.filter.message = { _ilike: `%${this.textSearch}%` }
      } else {
        delete this.filter.message
      }

      this.filter = { ...this.filter }

      this.previousSearch = this.textSearch
    },
    updateLogLevel() {
      if (this.logLevel.length === 0) {
        this.filter.level = { _eq: null }
      } else if (this.logLevel.length === 1) {
        this.filter.level = { _eq: this.logLevel[0] }
      } else {
        this.filter.level = { _in: this.logLevel }
      }

      this.filter = { ...this.filter }
    },
    openMenu() {
      this.menu = true
    }
  }
}
</script>

<template>
  <v-menu v-model="menu" :close-on-content-click="false" offset-y>
    <template #activator="{ on, attrs }">
      <v-btn
        depressed
        :class="buttonClass"
        class="px-2"
        color="primary"
        small
        v-bind="attrs"
        v-on="on"
      >
        <span class="mr-2 white--text">
          <v-icon class="fas fa-filter" small />
        </span>

        <span class="text-overline">
          Filter
        </span>
        <span>
          <v-icon small>
            {{ menu ? 'arrow_drop_up' : 'arrow_drop_down' }}
          </v-icon>
        </span>
      </v-btn>
    </template>

    <div class="appForeground elevation-1 pa-4">
      <div class="font-weight-light text-h5">Filter logs</div>
      <div
        class="d-flex align-center justify-center mt-4"
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
          @input="updateTextSearch"
          @keyup.enter="updateTextSearch"
        />
      </div>

      <div class="mt-6" style="max-width: 200px;">
        <v-select
          v-model="table"
          outlined
          label="Type"
          menu-props="offsetY"
          :items="tableOptions"
          dense
          hide-details
        >
          <template #item="{ item }">
            <v-list-item-content>
              <v-list-item-title class="text-body-1 font-weight-regular">
                {{ item.text }}
              </v-list-item-title>
            </v-list-item-content>
          </template>
        </v-select>
      </div>

      <div class="mt-6" style="max-width: 300px;">
        <v-select
          v-model="logLevel"
          outlined
          label="Levels"
          :items="logLevelOptions"
          dense
          offset-y
          multiple
          menu-props="offsetY"
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
              <span class="ml-1" :class="{ 'white--text': attrs.inputValue }">
                {{ item.text }}
              </span>
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

      <div class="mt-6 d-inline-flex align-center justify-center">
        <div class="mr-4">
          <DateTimePicker
            v-if="start"
            v-model="start"
            label="Start"
            icon="today"
          />
        </div>
        <DateTimePicker v-if="end" v-model="end" label="End" icon="event" />
      </div>

      <div class="mt-4 d-flex align-center justify-end">
        <v-btn class="ml-2" depressed small text @click="menu = false">
          Close
        </v-btn>

        <v-btn
          class="ml-2"
          depressed
          small
          text
          :disabled="applyDisabled"
          @click="resetChanges"
        >
          Reset
        </v-btn>

        <v-btn
          class="ml-2"
          color="primary"
          depressed
          small
          :disabled="applyDisabled"
          @click="applyChanges"
        >
          Apply
        </v-btn>
      </div>
    </div>
  </v-menu>
</template>

<style lang="scss">
/*  */
.position-sticky {
  position: sticky;
  top: 0;
}
</style>
