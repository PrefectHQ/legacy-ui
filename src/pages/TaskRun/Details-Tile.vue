<script>
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'
import { calculateDuration } from '@/utils/states'
export default {
  filters: {
    typeClass: val => val.split('.').pop()
  },
  components: {
    CardTitle,
    DurationSpan
  },
  mixins: [formatTime],
  props: {
    taskRun: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      copiedText: {}
    }
  },
  computed: {
    expectedRuns() {
      return (
        this.taskRun?.serialized_state?.n_map_states?.toLocaleString() ||
        'Unknown'
      )
    },
    filteredParams() {
      return {
        [this.taskRun.task.name]: this.taskRun.flow_run.parameters[
          this.taskRun.task.name
        ]
      }
    }
  },
  methods: {
    copyTextToClipboard(text) {
      if (!text) return

      this.copiedText = {}
      this.copiedText[text] = true
      navigator.clipboard.writeText(text)

      setTimeout(() => {
        this.copiedText = {}
        this.copiedText[text] = false
      }, 1000)
    },
    calculateDuration
  }
}
</script>

<template>
  <v-card class="pa-2" tile>
    <v-system-bar :color="taskRun.state" :height="5" absolute>
      <!-- We should include a state icon here when we've got those -->
      <!-- <v-icon>{{ flowRun.state }}</v-icon> -->
    </v-system-bar>

    <CardTitle
      :title="taskRun.task.name"
      icon="pi-task-run"
      :subtitle="taskRun.state"
      :params="{ name: 'task', params: { id: taskRun.task.id } }"
    />

    <v-list-item
      dense
      two-line
      :to="{ name: 'flow-run', params: { id: taskRun.flow_run.id } }"
      class="px-0"
    >
      <v-list-item-avatar class="mr-2">
        <v-icon small>pi-flow-run</v-icon>
      </v-list-item-avatar>
      <v-list-item-content>
        <span class="text-caption mb-0">
          Flow Run
        </span>
        <v-list-item-title class="text-body-2">
          <span>{{ taskRun.flow_run.name }}</span>
        </v-list-item-title>
        <v-list-item-title class="text-caption">
          <span :class="`${taskRun.flow_run.state}--text`">
            {{ taskRun.flow_run.state }}
          </span>
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-card-text class="pl-12 py-0">
      <v-list-item dense class="px-0">
        <v-list-item-content v-if="taskRun.state_message">
          <v-list-item-subtitle class="text-caption">
            Last State Message
          </v-list-item-subtitle>
          <div class="text-subtitle-2">
            <v-tooltip top>
              <template #activator="{ on }">
                <span class="text-caption" v-on="on">
                  [{{ formDate(taskRun.state_timestamp) }}]:
                </span>
              </template>
              <div>
                {{ formatTime(taskRun.state_timestamp) }}
              </div>
            </v-tooltip>
            {{ taskRun.state_message }}
          </div>
        </v-list-item-content>
      </v-list-item>

      <v-list-item dense class="pa-0">
        <v-list-item-content>
          <v-list-item-subtitle class="text-caption">
            <v-row v-if="taskRun.state == 'Mapped'" no-gutters>
              <v-col cols="6">
                Expected Mapped Runs
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                <v-tooltip top>
                  <template #activator="{ on }">
                    <span v-on="on">
                      {{ expectedRuns }}
                    </span>
                  </template>
                  <span v-if="!taskRun.serialized_state.n_map_states">
                    This data is only available on Flows registered with Prefect
                    Core 0.13.5+
                  </span>
                  <span v-else>
                    The number of mapped children expected to run. Note that the
                    number of active mapped runs may be less than this if some
                    have not begun running yet.
                  </span>
                </v-tooltip>
              </v-col>
            </v-row>

            <v-row v-if="taskRun.start_time" no-gutters>
              <v-col cols="6">
                Started
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                <v-tooltip top>
                  <template #activator="{ on }">
                    <span v-on="on">
                      {{
                        formDate(
                          taskRun.start_time || taskRun.scheduled_start_time
                        )
                      }}
                    </span>
                  </template>
                  <div>
                    {{
                      formatTime(
                        taskRun.start_time || taskRun.scheduled_start_time
                      )
                    }}
                  </div>
                </v-tooltip>
              </v-col>
            </v-row>
            <v-row v-if="taskRun.end_time" no-gutters>
              <v-col cols="6">
                Ended
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                <v-tooltip top>
                  <template #activator="{ on }">
                    <span v-on="on">
                      {{ formDate(taskRun.end_time) }}
                    </span>
                  </template>
                  <div>
                    {{ formatTime(taskRun.end_time) }}
                  </div>
                </v-tooltip>
              </v-col>
            </v-row>
            <v-row v-if="taskRun.start_time" no-gutters>
              <v-col cols="6">
                Duration
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                <DurationSpan
                  v-if="taskRun.start_time"
                  :start-time="taskRun.start_time"
                  :end-time="
                    calculateDuration(
                      taskRun.start_time,
                      taskRun.end_time,
                      taskRun.state
                    )
                  "
                />
                <span v-else>
                  <v-skeleton-loader type="text"></v-skeleton-loader>
                </span>
              </v-col>
            </v-row>
            <v-row v-if="taskRun.updated" no-gutters>
              <v-col cols="6">
                Updated
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                <v-tooltip top>
                  <template #activator="{ on }">
                    <span v-on="on">
                      {{ formDate(taskRun.updated) }}
                    </span>
                  </template>
                  <div>
                    {{ formatTime(taskRun.updated) }}
                  </div>
                </v-tooltip>
              </v-col>
            </v-row>

            <v-row
              v-if="
                taskRun.serialized_state && taskRun.serialized_state._result
              "
              no-gutters
            >
              <v-col cols="6">
                Result Type
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                {{ taskRun.serialized_state._result.type | typeClass }}
              </v-col>
            </v-row>

            <v-row
              v-if="
                taskRun.serialized_state && taskRun.serialized_state._result
              "
              no-gutters
            >
              <v-col cols="6">
                Result Location
              </v-col>
              <v-col cols="6" class="text-right font-weight-bold">
                <v-tooltip top>
                  <template #activator="{ on }">
                    <span
                      class="cursor-pointer show-icon-hover-focus-only pa-2px"
                      role="button"
                      @click="
                        copyTextToClipboard(
                          taskRun.serialized_state._result.location
                        )
                      "
                      v-on="on"
                    >
                      <v-icon
                        v-if="taskRun.serialized_state._result.location"
                        x-small
                        class="mb-2px mr-2"
                        tabindex="0"
                      >
                        {{
                          copiedText[taskRun.serialized_state._result.location]
                            ? 'check'
                            : 'file_copy'
                        }}
                      </v-icon>
                      {{ taskRun.serialized_state._result.location || 'None' }}
                    </span>
                  </template>
                  <div>
                    {{ taskRun.serialized_state._result.location || 'None' }}
                  </div>
                </v-tooltip>
              </v-col>
            </v-row>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        v-if="
          taskRun.task &&
            $options.filters.typeClass(taskRun.task.type) == 'Parameter'
        "
        dense
        two-line
        class="px-0"
      >
        <v-list-item-content>
          <v-list-item-subtitle>
            <div class="text-caption mb-0">
              Parameter:
            </div>

            <code class="mt-3 pa-3 no-before-after-content code-custom"
              >{{ filteredParams }}
            </code>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
a {
  text-decoration: none !important;
}

.code-custom {
  background-color: var(--v-appBackground-base);
  box-shadow: none;
  color: var(--v-codeBlue-base);
  font-size: 0.9em;
}

.no-before-after-content {
  &::before,
  &::after {
    content: '' !important;
  }
}

.show-icon-hover-focus-only {
  .v-icon {
    visibility: hidden;
  }

  &:hover,
  &:focus {
    .v-icon {
      visibility: visible;
    }
  }
}
</style>
