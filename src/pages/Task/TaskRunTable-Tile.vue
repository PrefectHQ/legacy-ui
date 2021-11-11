<script>
import CardTitle from '@/components/Card-Title'
import { roundedOneAgo } from '@/utils/dateTime'
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CardTitle,
    DurationSpan
  },
  mixins: [formatTime],
  props: {
    taskId: {
      required: true,
      type: String
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
        {
          text: 'Flow Run',
          value: 'flow_run',
          sortable: false,
          width: '30%'
        },
        {
          text: 'Start Time',
          value: 'start_time',
          align: 'start',
          width: '15%'
        },
        { text: 'End Time', value: 'end_time', align: 'start', width: '15%' },
        {
          text: 'Duration',
          value: 'duration',
          align: 'end',
          width: '10%',
          sortable: false
        },
        { text: 'State', value: 'state', align: 'end', width: '10%' }
      ],
      itemsPerPage: 15,
      page: 1,
      selectedDateFilter: 'day',
      sortBy: 'start_time',
      sortDesc: true,
      taskRunDurations: {},
      loading: 0
    }
  },
  computed: {
    tableTitle() {
      if (this.task) {
        return `${this.task.name} Task Runs`
      }
      return 'Task Runs'
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
    task: {
      query: require('@/graphql/Task/table-task-runs.gql'),
      variables() {
        const orderBy = {}
        orderBy[`${this.sortBy}`] = this.sortDesc ? 'desc' : 'asc'
        return {
          taskId: this.taskId,
          heartbeat: roundedOneAgo(this.selectedDateFilter),
          limit: this.itemsPerPage,
          offset: this.offset,
          orderBy
        }
      },
      loadingKey: 'loading',
      pollInterval: 5000,
      update: data => {
        return data.task_by_pk
      }
    },
    taskRunsCount: {
      query: require('@/graphql/Task/table-task-runs-count.gql'),
      variables() {
        return {
          taskId: this.taskId,
          heartbeat: roundedOneAgo(this.selectedDateFilter)
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
          <div slot="action" v-on="on">
            <v-select
              v-model="selectedDateFilter"
              class="time-interval-picker"
              :items="dateFilters"
              dense
              solo
              item-text="name"
              item-value="value"
              hide-details
              flat
            >
              <template #prepend-inner>
                <v-icon color="black" x-small>
                  history
                </v-icon>
              </template>
            </v-select>
          </div>
        </CardTitle>
      </template>
      <span>
        Filter by when runs were last updated
      </span>
    </v-tooltip>

    <v-card-text>
      <v-data-table
        :footer-props="{
          showFirstLastPage: true,
          itemsPerPageOptions: [10, 15, 25, 50],
          firstIcon: 'first_page',
          lastIcon: 'last_page',
          prevIcon: 'keyboard_arrow_left',
          nextIcon: 'keyboard_arrow_right'
        }"
        class="truncate-table"
        :headers="headers"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        :items="task ? task.task_runs : null || []"
        :items-per-page.sync="itemsPerPage"
        :loading="loading > 0"
        must-sort
        :page.sync="page"
        :server-items-length="taskRunsCount"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :class="{ 'fixed-table': $vuetify.breakpoint.smAndUp }"
        calculate-widths
      >
        <template #item.flow_run="{ item }">
          <v-tooltip top>
            <template #activator="{ on }">
              <router-link
                class="link"
                :to="{ name: 'task-run', params: { id: item.id } }"
              >
                <span v-on="on">{{ item.flow_run.name }}</span>
              </router-link>
            </template>
            <span
              >{{ item.flow_run.name }} - {{ task.name }}
              <span v-if="item.map_index > -1">
                (Mapped Child {{ item.map_index }})</span
              ></span
            >
          </v-tooltip>
        </template>

        <template #item.start_time="{ item }">
          <truncate :content="formatTime(item.start_time)">
            {{ formDate(item.start_time) }}
          </truncate>
        </template>

        <template #item.end_time="{ item }">
          <truncate :content="formatTime(item.end_time)">
            {{ formDate(item.end_time) }}
          </truncate>
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
          <truncate :content="item.state">
            <v-icon class="mr-1 pointer" small :color="item.state">
              brightness_1
            </v-icon>
          </truncate>
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
