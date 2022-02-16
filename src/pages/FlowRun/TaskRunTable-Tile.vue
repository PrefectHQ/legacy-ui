<script>
import CardTitle from '@/components/Card-Title'
import moment from 'moment-timezone'
import DurationSpan from '@/components/DurationSpan'
import ResumeButton from '@/components/ResumeButton'
import { formatTime } from '@/mixins/formatTimeMixin'
import { STATE_NAMES } from '@/utils/states'
import { calculateDuration } from '@/utils/states'

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
          width: '37.5%'
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
          width: '15.5%',
          sortable: false
        },
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
      state: [],
      states: STATE_NAMES.slice(1).sort(),
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
    onIntersect([entry]) {
      this.$apollo.queries.flowRun.skip = !entry.isIntersecting
      this.$apollo.queries.taskRunsCount.skip = !entry.isIntersecting
    },
    calculateDuration
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
          state: this.state.length === 0 ? null : this.state,
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
          name: this.searchFormatted,
          state: this.state.length === 0 ? null : this.state
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
  <v-card v-intersect="{ handler: onIntersect }" class="pa-2" tile>
    <CardTitle icon="pi-task-run">
      <div
        :slot="$vuetify.breakpoint.lgAndUp && 'title'"
        class="text-truncate pb-1"
      >
        {{ tableTitle }}
      </div>

      <div
        :slot="$vuetify.breakpoint.mdAndDown ? 'title' : 'state-filter'"
        :class="{ 'd-flex': $vuetify.breakpoint.mdAndUp }"
      >
        <v-select
          v-model="state"
          data-public
          outlined
          class="state-filter"
          :style="[
            $vuetify.breakpoint.mdAndUp ? { width: '280px' } : { width: '100%' }
          ]"
          dense
          flat
          solo
          hide-details
          :menu-props="{ top: true, offsetY: true }"
          clearable
          :items="states"
          label="Filter by state"
          multiple
        >
          <template #selection="{ item, index }">
            <v-chip
              v-if="index === 0 || index === 1"
              :color="item"
              label
              small
              text-color="white"
            >
              {{ item }}
            </v-chip>
            <span v-if="index === 2" class="grey--text text-caption">
              (+{{ state.length - 2 }})
            </span>
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
          placeholder="Search by Task Name"
          style="min-width: 210px;"
        >
        </v-text-field>
      </div>
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
        :class="{ 'fixed-table': $vuetify.breakpoint.smAndUp }"
        calculate-widths
      >
        <template #item.task.name="{ item }">
          <div class="text-truncate">
            <v-tooltip top>
              <template #activator="{ on }">
                <router-link
                  class="link text-truncate"
                  :data-cy="'task-run-table-link|' + item.task.name"
                  :to="{ name: 'task-run', params: { id: item.id } }"
                >
                  <span v-if="item.name" v-on="on">{{ item.name }}</span>
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
              <span v-if="item.name"
                >{{ flowRun.name }} - {{ item.task.name }} -
                {{ item.name }}</span
              >
              <span v-else>
                {{ flowRun.name }} - {{ item.task.name
                }}<span v-if="item.map_index > -1">
                  (Mapped Child {{ item.map_index }})</span
                ><span v-else-if="hasChild(item.task.name)"> (Parent) </span>
              </span>
            </v-tooltip>
          </div>
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
            :end-time="
              calculateDuration(item.start_time, item.end_time, item.state)
            "
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

        <template #item.action="{ item }">
          <ResumeButton
            v-if="item.state == 'Paused'"
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

.state-filter {
  .v-label {
    font-size: 0.85rem;
  }
}
</style>
