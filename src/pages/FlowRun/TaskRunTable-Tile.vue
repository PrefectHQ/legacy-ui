<script>
import CardTitle from '@/components/Card-Title'
import moment from 'moment-timezone'
import DurationSpan from '@/components/DurationSpan'
import ResumeButton from '@/components/ResumeButton'
import { formatTime } from '@/mixins/formatTimeMixin'
import { FINISHED_STATES } from '@/utils/states'

export default {
  components: {
    CardTitle,
    DurationSpan,
    ResumeButton
  },
  filters: {
    duration: function(v) {
      if (!v) return ''
      let d = moment.duration(v)._data,
        string = ''

      if (d.days) string += ` ${d.days}d`
      if (d.hours) string += ` ${d.hours}h`
      if (d.minutes) string += ` ${d.minutes}m`
      if (d.seconds) string += ` ${d.seconds}s`
      return string
    }
  },
  mixins: [formatTime],
  props: {
    flowRunId: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      headers: [
        {
          text: 'Task',
          value: 'task.name',
          sortable: false,
          width: '27.5%'
        },
        {
          text: 'Start Time',
          value: 'start_time',
          align: 'start',
          width: '20%'
        },
        { text: 'End Time', value: 'end_time', align: 'start', width: '15%' },
        { text: 'Duration', value: 'duration', align: 'end', width: '17.5%' },
        { text: 'State', value: 'state', align: 'end', width: '10%' },
        {
          text: '',
          value: 'action',
          sortable: false,
          align: 'center',
          width: '10%'
        }
      ],
      itemsPerPage: 15,
      page: 1,
      searchTerm: null,
      state: null,
      states: [
        'Failed',
        'Success',
        'Pending',
        'Cancelled',
        'Finished',
        'Skipped',
        'TimedOut',
        'Scheduled',
        'Resume'
      ],
      sortBy: 'start_time',
      sortDesc: true,
      taskRunDurations: {}
    }
  },
  computed: {
    offset() {
      return this.itemsPerPage * (this.page - 1)
    },
    tableTitle() {
      if (this.flowRun) {
        return `${this.flowRun.name} Task Runs`
      } else {
        return 'Task Runs'
      }
    },
    searchFormatted() {
      if (!this.searchTerm) return null
      return `%${this.searchTerm}%`
    }
  },
  methods: {
    hasChild(name) {
      const same = this.flowRun.task_runs.filter(
        taskRun => taskRun.task.name === name
      )
      if (same.length > 1) {
        return true
      }
    },
    isFinished(state) {
      return FINISHED_STATES.includes(state)
    }
  },
  apollo: {
    flowRun: {
      query: require('@/graphql/FlowRun/table-task-runs.gql'),
      variables() {
        const orderBy = {}
        orderBy[`${this.sortBy}`] = this.sortDesc ? 'desc' : 'asc'
        return {
          flowRunId: this.flowRunId,
          limit: this.itemsPerPage,
          name: this.searchFormatted,
          state: this.state,
          offset: this.offset,
          orderBy
        }
      },
      pollInterval: 5000,
      update: data => {
        return data && data.flow_run ? data.flow_run[0] : null
      }
    },
    taskRunsCount: {
      query: require('@/graphql/FlowRun/table-task-runs-count.gql'),
      variables() {
        return {
          flowRunId: this.flowRunId,
          name: this.searchFormatted
        }
      },
      pollInterval: 5000,
      update: data => {
        return data && data.task_run_aggregate
          ? data.task_run_aggregate.aggregate.count
          : null
      }
    }
  }
}
</script>

<template>
  <v-card class="pa-2" tile>
    <CardTitle :title="tableTitle" icon="pi-task-run">
      <v-select
        slot="sort"
        v-model="state"
        class="state-sort"
        solo
        flat
        outlined
        hide-selected
        dense
        clearable
        hide-details
        :items="states"
        label="Sort by state"
      >
        <template #selection="{ item }">
          <v-chip
            :color="item"
            label
            small
            text-color="white"
            class="sort-chip"
            >{{ item }}</v-chip
          >
        </template>
      </v-select>
      <v-text-field
        slot="action"
        v-model="searchTerm"
        class="task-search"
        dense
        flat
        solo
        prepend-inner-icon="search"
        hide-details
        placeholder="Search by Task or Run Name"
        style="min-width: 300px;"
      >
      </v-text-field>
    </CardTitle>
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
        :items="flowRun ? flowRun.task_runs : [] || []"
        :items-per-page.sync="itemsPerPage"
        :loading="$apollo.queries.flowRun.loading"
        must-sort
        :page.sync="page"
        :server-items-length="taskRunsCount"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :class="{ 'fixed-table': this.$vuetify.breakpoint.smAndUp }"
        calculate-widths
      >
        <template #item.task.name="{ item }">
          <div class="text-truncate">
            <v-tooltip top>
              <template #activator="{ on }">
                <router-link
                  class="link text-truncate"
                  :data-cy="'task-run-table-link|' + item.task.name"
                  :to="{ name: 'task-run', params: { id: item.details.id } }"
                >
                  <span v-if="item.name">{{ item.name }}</span>
                  <span v-else v-on="on"
                    >{{ item.task.name
                    }}<span v-if="item.map_index > -1">
                      (Mapped Child {{ item.map_index }})</span
                    ><span v-else-if="hasChild(item.task.name)">
                      (Parent)
                    </span>
                  </span>
                </router-link>
              </template>
              <span>
                {{ flowRun.name }} - {{ item.task.name
                }}<span v-if="item.map_index > -1">
                  (Mapped Child {{ item.map_index }})</span
                ><span v-else-if="hasChild(item.task.name)"> (Parent) </span>
              </span>
            </v-tooltip>
          </div>
        </template>

        <template #item.start_time="{ item }">
          <truncate :content="formatTime(item.details.start_time)">
            {{ formDate(item.details.start_time) }}
          </truncate>
        </template>

        <template #item.end_time="{ item }">
          <truncate :content="formatTime(item.details.end_time)">
            {{ formDate(item.details.end_time) }}
          </truncate>
        </template>

        <template #item.duration="{ item }">
          <DurationSpan
            v-if="item.details.start_time"
            :start-time="item.details.start_time"
            :end-time="
              item.details.end_time
                ? item.details.end_time
                : isFinished(item.details.state)
                ? item.details.start_time
                : null
            "
          />
          <span v-else>...</span>
        </template>

        <template #item.state="{ item }">
          <truncate :content="item.details.state">
            <v-icon class="mr-1 pointer" small :color="item.details.state">
              brightness_1
            </v-icon>
          </truncate>
        </template>

        <template #item.action="{ item }">
          <ResumeButton
            v-if="item.details.state == 'Paused'"
            :task-run="{ ...item, flow_run: flowRun }"
            dialog-type="resume"
          />
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<style lang="scss">
.task-search {
  border-radius: 0 !important;
  font-size: 0.85rem;

  .v-icon {
    font-size: 20px !important;
  }
}

.sort-chip {
  justify-content: center;
  width: 100px;
}

.state-sort {
  width: 180px;

  .v-label {
    font-size: 0.85rem;
  }
}
</style>
