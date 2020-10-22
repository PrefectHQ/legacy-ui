<script>
import { STATE_COLORS, STATE_TYPES } from '@/utils/states'
import { mapGetters } from 'vuex'
import debounce from 'lodash.debounce'
import moment from 'moment-timezone'
import FullPagination from '@/components/FullPagination'
import DurationSpan from '@/components/DurationSpan'

export default {
  components: { DurationSpan, FullPagination },
  props: {
    flowRunId: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      chartRenderColorIndex: 0,
      colors: STATE_COLORS,
      limit: 25,
      menuStyle: {},
      page: 1,
      presentStates: {},
      positionX: null,
      positionY: null,
      selectedActivityStateFilter: [],
      showMenu: false,
      showTooltip: false,
      tooltipTaskRun: null,
      menuTaskRun: null,
      sortOrder: 'desc',
      tableSearchInput: null
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    ...mapGetters('api', ['isCloud']),
    tableSearchFormatted() {
      if (!this.tableSearchInput) return null
      return `%${this.tableSearchInput}%`
    },
    chartData() {
      const series = [
        {
          name: this.flowRun.flow.name,
          data: this.flowRun.task_runs.map(taskRun => {
            // We handle tasks that don't start by not showing this chart at all
            // if the task run has a start time and end time
            if (taskRun.start_time) {
              return {
                x: this.taskRunNameFormatter(taskRun),
                y: [
                  new Date(taskRun.start_time).getTime(),
                  taskRun.end_time
                    ? new Date(taskRun.end_time).getTime()
                    : new Date().getTime()
                ]
              }
            }
            // if the task is running or didn't get an start_time or end_time
            return {
              x: this.taskRunNameFormatter(taskRun),
              y: [
                new Date(this.flowRun.start_time).getTime(),
                this.flowRun.end_time
                  ? new Date(this.flowRun.end_time).getTime()
                  : new Date().getTime()
              ]
            }
          })
        }
      ]
      return {
        series,
        options: {
          chart: {
            events: {
              dataPointSelection: this.handleDataPointSelection,
              dataPointMouseEnter: this.handleDataPointMouseEnter,
              mouseMove: this.handleDataPointMouseMove,
              dataPointMouseLeave: this.handleDataPointMouseLeave
            },
            toolbar: {
              show: false
            }
          },
          colors: this.flowRun.task_runs.map(task => STATE_COLORS[task.state]),
          plotOptions: {
            bar: {
              horizontal: true
            }
          },
          tooltip: {
            enabled: false
          },
          xaxis: {
            type: 'datetime',
            labels: {
              formatter: this.formatDate
            }
          },
          yaxis: {
            min: new Date(this.flowRun.start_time).getTime(),
            max: this.flowRun.end_time
              ? new Date(this.flowRun.end_time).getTime()
              : new Date().getTime()
          }
        }
      }
    },
    tooltipStyle() {
      return {
        left: `${this.positionX}px`,
        position: 'absolute',
        top: `${this.positionY}px`,
        width: '250px',
        'z-index': 2
      }
    },
    noChartMessage() {
      if (!this.flowRun || this.flowRun.start_time) return null
      if (
        !this.flowRun.start_time &&
        STATE_TYPES[this.flowRun.state] === 'Pending'
      ) {
        return "Flow Run Hasn't Started Yet"
      } else if (
        !this.flowRun.start_time &&
        STATE_TYPES[this.flowRun.state] === 'Finished'
      ) {
        return 'Flow Run Did Not Start Successfully'
      }
      return null
    },
    offset() {
      return this.limit * (this.page - 1)
    }
  },
  watch: {
    flowRun(val) {
      if (val?.end_time) {
        this.$apollo.queries.flowRun.stopPolling()
      }
    },
    selectedActivityStateFilter() {
      this.page = 1
    }
  },
  methods: {
    handleChangePagination(newLimit) {
      this.limit = newLimit
    },
    handleSort() {
      if (this.sortOrder === 'asc') {
        this.sortOrder = 'desc'
      } else {
        this.sortOrder = 'asc'
      }
    },
    handleDataPointMouseLeave() {
      this.showTooltip = false
    },
    handleDataPointSelection(event, chartContext, config) {
      const taskRun = this.flowRun.task_runs[config.dataPointIndex]

      if (taskRun?.id == this.menuTaskRun?.id) {
        this.menuTaskRun = null
        this.showMenu = false
        return
      }

      const bounds = this.$refs.container.getBoundingClientRect()

      this.menuStyle = {
        left: `${event.clientX + 5 - bounds.left}px`,
        position: 'absolute',
        top: `${event.clientY + 5 - bounds.top}px`,
        width: '250px'
      }

      this.menuTaskRun = taskRun

      this.showTooltip = false
      this.showMenu = true
    },
    hideMenu() {
      this.showMenu = false
    },
    handleDataPointMouseMove(event) {
      const bounds = this.$refs.container.getBoundingClientRect()
      this.positionX = event.clientX + 5 - bounds.left
      this.positionY = event.clientY + 5 - bounds.top
    },
    handleDataPointMouseEnter(event, chartContext, config) {
      event.target.style.cursor = 'pointer'
      this.tooltipTaskRun = this.taskRuns[config.dataPointIndex]

      if (this.menuTaskRun?.id !== this.tooltipTaskRun?.id) {
        this.showTooltip = true
      }
    },
    formatDate(value) {
      if (this.timezone) {
        return moment(value)
          .tz(this.timezone)
          .format('LTS')
      }
      return moment(value).format('LTS')
    },
    statusStyle(state) {
      return {
        'border-radius': '50%',
        display: 'inline-block',
        'background-color': `var(--v-${state}-base)`,
        height: '0.75rem',
        width: '0.75rem'
      }
    },
    taskRunNameFormatter(taskRun) {
      if (typeof taskRun.map_index === 'number' && taskRun.map_index > -1) {
        return `${taskRun.task.name} (${taskRun.map_index})`
      }
      return taskRun.task.name
    },
    handleTableSearchInput: debounce(function(e) {
      this.tableSearchInput = e
    }, 300)
  },
  apollo: {
    flowRun: {
      query() {
        return require('@/graphql/FlowRun/gantt-task-runs.gql')
      },
      variables() {
        let taskRunStates
        if (this.selectedActivityStateFilter.length) {
          taskRunStates = this.selectedActivityStateFilter
        } else {
          taskRunStates = null
        }

        return {
          taskRunStates,
          taskName: this.tableSearchFormatted,
          id: this.flowRunId,
          limit: this.limit,
          offset: this.offset,
          sort: this.sortOrder
        }
      },
      pollInterval: 5000,
      update: data => data.flow_run_by_pk
    }
  }
}
</script>
<template>
  <v-card v-if="flowRun" class="ma-0" flat>
    <v-list-item dense class="px-0 mt-2">
      <v-list-item-avatar class="mr-2">
        <v-icon color="black">
          bar_chart
        </v-icon>
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title class="title">
          <v-row no-gutters class="d-flex align-center">
            <v-col cols="9"><div>Task Runs</div></v-col>
            <v-col cols="3">
              <v-text-field
                class="mx-2 task-run-search"
                :class="{ 'my-1': $vuetify.breakpoint.mdAndUp }"
                hide-details
                label="Task Name"
                prepend-inner-icon="search"
                dense
                solo
                flat
                single-line
                @input="handleTableSearchInput"
              />
            </v-col>
          </v-row>
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-divider class="ml-12"></v-divider>

    <v-subheader
      v-if="!noChartMessage"
      color="white"
      class="d-block subtitle-2 black--text medium pt-2"
    >
      <div>
        <v-btn-toggle v-model="selectedActivityStateFilter" multiple>
          <v-btn
            v-for="(taskRun, index) in flowRun.task_run_states"
            :key="index"
            active-class="grey"
            text
            class="text-none mx-1"
            :value="taskRun.state"
            outlined
          >
            <v-icon small left :color="colors[taskRun.state]">
              brightness_1
            </v-icon>
            {{ taskRun.state }}
          </v-btn>
        </v-btn-toggle>
      </div>
      <div class="d-flex align-baseline pt-1">
        <div
          class="text-capitalize subtitle-2 black--text medium bold mr-2 px-4 py-1"
        >
          Name
        </div>

        <v-btn
          text
          class="text-capitalize subtitle-2 black--text medium bold"
          active-class="light"
          @click="handleSort()"
        >
          Start time
          <v-icon v-if="sortOrder === 'asc'">
            arrow_drop_up
          </v-icon>
          <v-icon v-else>
            arrow_drop_down
          </v-icon>
        </v-btn>
      </div>
    </v-subheader>

    <v-card-text v-if="noChartMessage">
      {{ noChartMessage }}
    </v-card-text>
    <v-card-text v-else class="pt-0">
      <div ref="container">
        <ApexChart
          v-click-outside="hideMenu"
          class="mt-10"
          :height="`${75 * flowRun.task_runs.length + 75}px`"
          :options="chartData.options"
          :series="chartData.series"
          type="rangeBar"
        />

        <v-fade-transition mode="out-in">
          <v-card v-if="showTooltip" :style="tooltipStyle" tile>
            <v-card-title
              :style="{ color: `var(--v-${tooltipTaskRun.state}-base)` }"
              class="text-subtitle-1"
            >
              <div>
                {{ tooltipTaskRun.task.name
                }}{{
                  tooltipTaskRun.map_index > -1
                    ? `(${tooltipTaskRun.map_index})`
                    : ''
                }}
                <div class="caption grey--text text--lighten-1">
                  (Click for more details)
                </div>
              </div>
            </v-card-title>
            <v-card-text>
              <div>
                State:
                <span :style="statusStyle(tooltipTaskRun.state)"></span>
                <span class="font-weight-bold">
                  {{ tooltipTaskRun.state }}</span
                >
              </div>
              <div
                v-if="tooltipTaskRun.start_time || flowRun.start_time"
                class="subtitle d-flex align-end justify-space-between"
              >
                Duration:

                <DurationSpan
                  class="font-weight-bold"
                  :start-time="tooltipTaskRun.start_time || flowRun.start_time"
                  :end-time="
                    tooltipTaskRun.end_time
                      ? tooltipTaskRun.end_time
                      : flowRun.end_time
                  "
                />
              </div>

              <div
                v-if="tooltipTaskRun.start_time || flowRun.start_time"
                class="subtitle d-flex align-end justify-space-between"
              >
                Start:

                <span class="font-weight-bold">
                  {{
                    formatDate(tooltipTaskRun.start_time || flowRun.start_time)
                  }}
                </span>
              </div>

              <div
                v-if="tooltipTaskRun.end_time || flowRun.end_time"
                class="subtitle d-flex align-end justify-space-between"
              >
                End:

                <span class="font-weight-bold">
                  {{ formatDate(tooltipTaskRun.end_time || flowRun.end_time) }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-fade-transition>

        <v-expand-transition mode="out-in">
          <v-card v-if="showMenu" :style="menuStyle" tile>
            <v-card-title class="text-subtitle-1">
              <router-link
                :to="{ name: 'task-run', params: { id: menuTaskRun.id } }"
              >
                {{ menuTaskRun.task.name
                }}{{
                  menuTaskRun.map_index > -1 ? `(${menuTaskRun.map_index})` : ''
                }}
              </router-link>
            </v-card-title>
            <v-card-text>
              <div>
                State:
                <span :style="statusStyle(tooltipTaskRun.state)"></span>
                <span class="font-weight-bold">
                  {{ tooltipTaskRun.state }}</span
                >
              </div>

              <div
                v-if="menuTaskRun.start_time || flowRun.start_time"
                class="subtitle d-flex align-end justify-space-between"
              >
                Duration:

                <DurationSpan
                  class="font-weight-bold"
                  :start-time="menuTaskRun.start_time || flowRun.start_time"
                  :end-time="
                    menuTaskRun.end_time
                      ? menuTaskRun.end_time
                      : flowRun.end_time
                  "
                />
              </div>

              <div
                v-if="menuTaskRun.start_time || flowRun.start_time"
                class="subtitle d-flex align-end justify-space-between"
              >
                Start:

                <span class="font-weight-bold">
                  {{ formatDate(menuTaskRun.start_time || flowRun.start_time) }}
                </span>
              </div>

              <div
                v-if="menuTaskRun.end_time || flowRun.end_time"
                class="subtitle d-flex align-end justify-space-between"
              >
                End:

                <span class="font-weight-bold">
                  {{ formatDate(menuTaskRun.end_time || flowRun.end_time) }}
                </span>
              </div>

              <div
                v-if="menuTaskRun.state_timestamp"
                class="subtitle d-flex align-end justify-space-between"
              >
                Updated:

                <span class="font-weight-bold">
                  {{ formatDate(menuTaskRun.state_timestamp) }}
                </span>
              </div>

              <div class="subtitle d-flex align-end justify-space-between">
                Max Retries:

                <span class="font-weight-bold">
                  {{ menuTaskRun.task.max_retries || 0 }}
                </span>
              </div>

              <div class="subtitle d-flex align-end justify-space-between">
                Retry delay:

                <span class="font-weight-bold">
                  {{ menuTaskRun.task.retry_delay || 0 }}
                </span>
              </div>

              <v-divider class="my-2" />

              <div class="text-subtitle-1">
                <div>Message:</div>

                <div class="font-weight-bold">
                  {{ menuTaskRun.state_message || 'No message' }}
                </div>
              </div>

              <v-divider class="my-2" />

              <div class="text-subtitle-1">
                <div>Result:</div>

                <div class="font-weight-bold">
                  {{ menuTaskRun.state_result || 'No result' }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-expand-transition>

        <FullPagination
          :count-options="[10, 25, 50, 100]"
          :page="page"
          :total-items="flowRun.task_runs_aggregate.aggregate.count"
          @change-count-option="handleChangePagination"
          @change-page="newPage => (page = newPage)"
        />
      </div>
    </v-card-text>
  </v-card>

  <v-card v-else class="fill-height" fluid justify-center>
    <div />
  </v-card>
</template>

<style lang="scss" scoped>
p {
  font-family: sans-serif;
  margin-bottom: 21px;
  padding-left: 12px;
  padding-right: 40px;
}

.v-btn-toggle > .v-btn.v-btn {
  border-left-width: thin;
}
</style>

<style lang="scss">
.task-run-search {
  margin: auto !important;
  margin-right: 0 !important;
}
</style>
