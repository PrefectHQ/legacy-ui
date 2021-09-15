<script>
import { mapGetters } from 'vuex'
import jsBeautify from 'js-beautify'
import { formatTime } from '@/mixins/formatTimeMixin'
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import LabelEdit from '@/components/LabelEdit'
import { FINISHED_STATES } from '@/utils/states'

export default {
  components: {
    CardTitle,
    DurationSpan,
    LabelEdit
  },
  mixins: [formatTime],
  props: {
    flowRun: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      tab: 'overview'
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('api', ['isCloud']),
    hasContext() {
      return (
        this.flowRun.context && Object.keys(this.flowRun.context).length > 0
      )
    },
    isFinished() {
      return FINISHED_STATES.includes(this.flowRun.state)
    },
    hasParameters() {
      if (!this.flowRun?.parameters && !this.flowRun?.flow?.parameters)
        return false
      return (
        Object.keys(this.flowRun.parameters).length > 0 ||
        this.flowRun.flow.parameters.length > 0
      )
    },
    hasRunConfig() {
      return (
        this.flowRun?.run_config &&
        Object.keys(this.flowRun.run_config).length > 0
      )
    },
    flowRunParams() {
      const flowParams = this.flowRun?.flow?.parameters.reduce(
        (accum, currentParam) => {
          accum[currentParam.name] = currentParam.default
          return accum
        },
        {}
      )
      return { ...flowParams, ...this.flowRun?.parameters }
    },
    isCloudOrAutoScheduled() {
      return this.isCloud || this.flowRun?.auto_scheduled
    }
  },
  methods: {
    formatJson(obj) {
      return jsBeautify(JSON.stringify(obj), {
        indent_size: 2,
        space_in_empty_paren: true,
        preserve_newlines: false
      })
    }
  }
}
</script>

<template>
  <v-card class="py-2" tile>
    <v-system-bar
      :color="flowRun.state"
      :data-cy="'details-tile-flow-run-state|' + flowRun.state.toLowerCase()"
      :height="5"
      absolute
    >
      <!-- We should include a state icon here when we've got those -->
      <!-- <v-icon>{{ flowRun.state }}</v-icon> -->
    </v-system-bar>

    <CardTitle
      v-if="hasParameters || hasContext || hasRunConfig"
      icon="pi-flow-run"
    >
      <v-row slot="title" no-gutters class="d-flex align-center">
        <v-col cols="8">
          <div class="text-truncate pb-1">
            {{ flowRun.name }}
          </div>
        </v-col>
      </v-row>

      <div slot="action" class="d-flex flex-column align-end">
        <v-btn
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'overview' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'overview'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'overview'"
        >
          Overview
          <v-icon small>calendar_view_day</v-icon>
        </v-btn>

        <v-btn
          v-if="hasParameters"
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'parameters' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'parameters'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'parameters'"
        >
          Parameters
          <v-icon small>notes</v-icon>
        </v-btn>

        <v-btn
          v-if="hasContext"
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'context' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'context'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'context'"
        >
          Context
          <v-icon small>list</v-icon>
        </v-btn>

        <v-btn
          v-if="hasRunConfig"
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'run_config' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'run_config'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'run_config'"
        >
          Run Config
          <v-icon small>notes</v-icon>
        </v-btn>
      </div>
    </CardTitle>

    <CardTitle v-else :title="flowRun.name" icon="pi-flow-run" />

    <v-card-text class="pa-0">
      <v-fade-transition hide-on-leave>
        <v-list v-if="tab === 'overview'">
          <v-list-item v-if="isCloudOrAutoScheduled">
            <v-list-item-content>
              <v-list-item-subtitle class="text-caption">
                Created by
              </v-list-item-subtitle>
              <div class="text-subtitle-2">
                {{
                  flowRun.auto_scheduled
                    ? 'The Prefect Scheduler'
                    : flowRun.created_by
                    ? flowRun.created_by.username
                    : 'A nonexistant user'
                }}
              </div>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="flowRun.state_message" dense>
            <v-list-item-content>
              <v-list-item-subtitle class="text-caption">
                Last State Message
              </v-list-item-subtitle>

              <truncate :content="flowRun.state_message">
                [{{ formatTime(flowRun.state_timestamp) }}]:
                {{ flowRun.state_message }}
              </truncate>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="flowRun.agent_id" dense>
            <v-list-item-content>
              <v-list-item-subtitle class="text-caption">
                Agent ID
              </v-list-item-subtitle>
              <router-link
                class="link"
                :to="{
                  name: 'agent',
                  params: { tenant: tenant.slug, id: flowRun.agent_id }
                }"
              >
                {{ flowRun.agent_id }}
              </router-link>
            </v-list-item-content>
          </v-list-item>

          <v-list-item dense>
            <v-list-item-content>
              <v-list-item-subtitle class="text-caption">
                <v-row no-gutters>
                  <v-col cols="6"> {{ flowRun.flow.name }} version </v-col>
                  <v-col cols="6" class="text-right font-weight-bold">
                    <router-link
                      class="link"
                      :to="{ name: 'flow', params: { id: flowRun.flow.id } }"
                    >
                      {{ flowRun.flow.version }}
                    </router-link>
                  </v-col>
                </v-row>

                <v-row no-gutters>
                  <v-col v-if="flowRun.start_time" cols="6">
                    Scheduled Start Time
                  </v-col>
                  <v-col
                    v-if="flowRun.start_time"
                    cols="6"
                    class="text-right font-weight-bold"
                  >
                    <v-tooltip top>
                      <template #activator="{ on }">
                        <span v-on="on">
                          {{ formatTime(flowRun.scheduled_start_time) }}
                        </span>
                      </template>
                      <div>
                        {{ formatDateTime(flowRun.scheduled_start_time) }}
                      </div>
                    </v-tooltip>
                  </v-col>
                  <v-col cols="6">
                    {{ flowRun.start_time ? 'Started' : 'Scheduled to start' }}
                  </v-col>
                  <v-col cols="6" class="text-right font-weight-bold">
                    <v-tooltip top>
                      <template #activator="{ on }">
                        <span v-on="on">
                          {{
                            flowRun.start_time
                              ? formatTime(flowRun.start_time)
                              : formatTime(flowRun.scheduled_start_time)
                          }}
                        </span>
                      </template>
                      <div>
                        {{
                          flowRun.start_time
                            ? formatDateTime(flowRun.start_time)
                            : formatDateTime(flowRun.scheduled_start_time)
                        }}
                      </div>
                    </v-tooltip>
                  </v-col>
                </v-row>
                <v-row v-if="flowRun.end_time" no-gutters>
                  <v-col cols="6"> Ended </v-col>
                  <v-col cols="6" class="text-right font-weight-bold">
                    <v-tooltip top>
                      <template #activator="{ on }">
                        <span v-on="on">
                          {{ formatTime(flowRun.end_time) }}
                        </span>
                      </template>
                      <div>
                        {{ formatDateTime(flowRun.end_time) }}
                      </div>
                    </v-tooltip>
                  </v-col>
                </v-row>
                <v-row v-if="flowRun.start_time" no-gutters>
                  <v-col cols="6"> Duration </v-col>
                  <v-col cols="6" class="text-right font-weight-bold">
                    <!-- Check for isFinished improves duration handling for restarted flows  -->
                    <DurationSpan
                      v-if="flowRun.start_time"
                      :start-time="flowRun.start_time"
                      :end-time="
                        isFinished && flowRun.start_time
                          ? flowRun.end_time
                          : null
                      "
                    />
                    <span v-else>
                      <v-skeleton-loader type="text"></v-skeleton-loader>
                    </span>
                  </v-col>
                </v-row>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <LabelEdit type="flowRun" :flow-run="flowRun" />
        </v-list>
      </v-fade-transition>

      <v-fade-transition hide-on-leave>
        <div
          v-if="tab === 'parameters'"
          class="text-body-2 appForeground rounded-sm pa-5 code-block"
        >
          {{ formatJson(flowRunParams) }}
        </div>
      </v-fade-transition>

      <v-fade-transition hide-on-leave>
        <div
          v-if="tab === 'context'"
          class="text-body-2 appForeground rounded-sm pa-5 code-block"
        >
          {{ formatJson(flowRun.context) }}
        </div>
      </v-fade-transition>

      <v-fade-transition hide-on-leave>
        <div
          v-if="tab === 'run_config'"
          class="text-body-2 appForeground rounded-sm pa-5 code-block"
        >
          {{ formatJson(flowRun.run_config) }}
        </div>
      </v-fade-transition>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.card-content {
  max-height: 254px;
  overflow-y: auto;
}

.code-block {
  border: 1px solid var(--v-utilGrayLight-base) !important;
  font-family: 'Source Code Pro', monospace !important;
  white-space: pre-wrap;
}

.w-100 {
  width: 100% !important;
}
</style>
