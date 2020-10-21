<script>
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'

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
      itemsPerPage: 25,
      page: 1,
      selectedDateFilter: 'day',
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
  methods: {},
  apollo: {
    taskRuns: {
      query: require('@/graphql/TaskRun/table-mapped-task-runs.gql'),
      variables() {
        const orderBy = {}
        orderBy[`${this.sortBy}`] = this.sortDesc ? 'desc' : 'asc'
        return {
          where: {
            task_id: { _eq: this.taskRun.task.id },
            flow_run_id: { _eq: this.taskRun.flow_run.id }
          },
          limit: this.itemsPerPage,
          offset: this.offset,
          orderBy
        }
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
      variables() {
        return {
          where: {
            task_id: { _eq: this.taskRun.task.id },
            flow_run_id: { _eq: this.taskRun.flow_run.id }
          }
        }
      },
      pollInterval: 5000,
      update: data =>
        data && data.task_run_aggregate
          ? data.task_run_aggregate.aggregate.count
          : null
    }
  }
}
</script>

<template>
  <v-card class="pa-2 mt-2" tile>
    <v-tooltip top>
      <template #activator="{ on }">
        <CardTitle :title="tableTitle" icon="pi-task-run">
          <div slot="action" v-on="on"> </div>
        </CardTitle>
      </template>
      <span>
        Filter by when runs were last updated
      </span>
    </v-tooltip>

    <v-card-text>
      <v-data-table
        v-model="selected"
        :footer-props="{
          showFirstLastPage: true,
          itemsPerPageOptions: [5, 15, 25, 50],
          firstIcon: 'first_page',
          lastIcon: 'last_page',
          prevIcon: 'keyboard_arrow_left',
          nextIcon: 'keyboard_arrow_right'
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
        :server-items-length="taskRunsCount"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :class="{ 'fixed-table': this.$vuetify.breakpoint.smAndUp }"
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
            :end-time="item.end_time"
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
.time-interval-picker {
  font-size: 0.85rem;
  margin: auto;
  margin-right: 0;
  max-width: 150px;
}
</style>
