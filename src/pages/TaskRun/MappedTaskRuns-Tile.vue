<script>
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'
import { duration } from '@/utils/calculateDuration'

export default {
  components: {
    CardTitle,
    DurationSpan
  },
  mixins: [formatTime],
  props: {
    taskRun: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      dateFilters: [
        { name: '1 Hour', value: 'hour' },
        { name: '24 Hours', value: 'day' },
        { name: '7 Days', value: 'week' },
        { name: '30 Days', value: 'month' }
      ],
      headers: [
        { text: 'State', value: 'state', align: 'start', width: '7.5%' },
        {
          text: 'Map Index',
          value: 'map_index',
          width: '10%'
        },
        {
          text: 'Task Run Name',
          value: 'name',
          width: '20%'
        },
        {
          text: 'Start Time',
          value: 'start_time',
          align: 'start',
          width: '20%'
        },
        { text: 'End Time', value: 'end_time', align: 'start', width: '20%' },
        {
          text: 'Duration',
          sortable: false,
          value: 'duration',
          align: 'end',
          width: '15%'
        }
      ],
      initialPageSet: false,
      itemsPerPage: 25,
      page: 1,
      searchTerm: null,
      selectedDateFilter: 'day',
      serverItemsLength: null,
      sortBy: 'map_index',
      sortDesc: false,
      taskRunDurations: {},
      loading: 0,
      selected: []
    }
  },
  computed: {
    tableTitle() {
      return `${this.taskRun?.name ?? this.taskRun?.task?.name} Task Runs`
    },
    offset() {
      return this.itemsPerPage * (this.page - 1)
    },
    searchFormatted() {
      if (!this.searchTerm) return null
      return `%${this.searchTerm}%`
    }
  },
  methods: {
    durationCalc(startTime, endTime, state) {
      return duration(startTime, endTime, state)
    }
  },
  apollo: {
    taskRuns: {
      query: require('@/graphql/TaskRun/table-mapped-task-runs.gql'),
      throttle: 500,
      debounce: 250,
      variables() {
        const orderBy = {}
        orderBy[`${this.sortBy}`] = this.sortDesc ? 'desc' : 'asc'

        const where = {
          task_id: { _eq: this.taskRun.task.id },
          flow_run_id: { _eq: this.taskRun.flow_run.id }
        }
        const _or = []
        const mapSearch = parseInt(this.searchTerm)

        if (mapSearch) {
          _or.push({ map_index: { _eq: mapSearch } })
        }
        if (this.searchTerm !== null) {
          _or.push({
            name: { _ilike: this.searchFormatted }
          })
        }

        if (_or.length) {
          where._or = _or
        }

        return {
          where,
          limit: this.itemsPerPage,
          offset: this.offset,
          orderBy
        }
      },
      skip() {
        return !this.initialPageSet
      },
      loadingKey: 'loading',
      pollInterval: 5000,
      update(data) {
        const selected = data.task_run.find(t => t.id == this.taskRun.id)
        this.selected = [selected]
        return data.task_run
      }
    },
    taskRunsCount: {
      query: require('@/graphql/TaskRun/table-mapped-task-runs-count.gql'),
      throttle: 500,
      debounce: 250,
      variables() {
        const where = {
          task_id: { _eq: this.taskRun.task.id },
          flow_run_id: { _eq: this.taskRun.flow_run.id }
        }
        const _or = []
        const mapSearch = parseInt(this.searchTerm)

        if (mapSearch) {
          _or.push({ map_index: { _eq: mapSearch } })
        }
        if (this.searchTerm !== null) {
          _or.push({
            name: { _ilike: this.searchFormatted }
          })
        }

        if (_or.length) {
          where._or = _or
        }
        return {
          where
        }
      },
      pollInterval: 5000,
      update(data) {
        this.serverItemsLength = data?.task_run_aggregate?.aggregate?.count

        if (!this.initialPageSet) {
          this.page = Math.ceil(
            Math.abs(this.taskRun.map_index) / this.itemsPerPage
          )

          this.initialPageSet = true
        }

        return data?.task_run_aggregate?.aggregate?.count ?? null
      }
    }
  }
}
</script>

<template>
  <v-card class="pa-2 mt-2" tile>
    <CardTitle :title="tableTitle" icon="pi-task-run">
      <v-text-field
        slot="action"
        v-model="searchTerm"
        class="task-search"
        flat
        solo
        prepend-inner-icon="search"
        hide-details
        placeholder="Search by run name or map index"
        style="min-width: 300px;"
      >
      </v-text-field>
    </CardTitle>

    <v-card-text>
      <v-data-table
        v-model="selected"
        :footer-props="{
          showFirstLastPage: true,
          itemsPerPageOptions: [10, 15, 25, 50],
          firstIcon: 'first_page',
          lastIcon: 'last_page',
          prevIcon: 'keyboard_arrow_left',
          nextIcon: 'keyboard_arrow_right',
          showCurrentPage: true
        }"
        single-select
        class="truncate-table"
        :headers="headers"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        :items="taskRuns"
        :items-per-page.sync="itemsPerPage"
        :loading="loading > 0"
        must-sort
        item-key="id"
        :page.sync="page"
        :server-items-length="serverItemsLength"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :class="{ 'fixed-table': $vuetify.breakpoint.smAndUp }"
        calculate-widths
      >
        <template #item.name="{ item }">
          <v-tooltip top>
            <template #activator="{ on }">
              <router-link
                class="link"
                :to="{ name: 'task-run', params: { id: item.id } }"
              >
                <span v-on="on">
                  {{ item.name || taskRun.task.name }}
                </span>
              </router-link>
            </template>
            <span v-if="item.name">
              {{ item.name }}
              <span v-if="item.map_index > -1">
                ({{ taskRun.task.name }} Child
                {{ item.map_index.toLocaleString() }})
              </span>
            </span>
            <span v-else-if="item.map_index > -1">
              {{ taskRun.task.name }} Child
              {{ item.map_index.toLocaleString() }}
            </span>
            <span v-else> {{ taskRun.task.name }} Parent </span>
          </v-tooltip>
        </template>

        <template #item.map_index="{ item }">
          <span>
            {{
              item.map_index === -1 ? 'Parent' : item.map_index.toLocaleString()
            }}
          </span>
        </template>

        <template #item.start_time="{ item }">
          <v-tooltip v-if="item.start_time" top>
            <template #activator="{ on }">
              <span v-on="on"> {{ formDate(item.start_time) }}</span>
            </template>
            <span> {{ formatTime(item.start_time) }}</span>
          </v-tooltip>
          <span v-else>...</span>
        </template>

        <template #item.end_time="{ item }">
          <v-tooltip v-if="item.end_time" top>
            <template #activator="{ on }">
              <span v-on="on">{{ formDate(item.end_time) }}</span>
            </template>
            <span>{{ formatTime(item.end_time) }}</span>
          </v-tooltip>
          <span v-else>...</span>
        </template>

        <template #item.duration="{ item }">
          <DurationSpan
            v-if="item.start_time"
            :start-time="item.start_time"
            :end-time="durationCalc(item.start_time, item.end_time, item.state)"
          />
          <span v-else>...</span>
        </template>
        <template #item.state="{ item }">
          <v-tooltip top>
            <template #activator="{ on }">
              <v-icon class="mr-1 pointer" small :color="item.state" v-on="on">
                brightness_1
              </v-icon>
            </template>
            <span>{{ item.state }}</span>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.task-search {
  border-radius: 0 !important;
  font-size: 0.85rem;

  .v-icon {
    font-size: 20px !important;
  }
}
</style>
