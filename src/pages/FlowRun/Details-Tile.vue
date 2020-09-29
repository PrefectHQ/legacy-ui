<script>
import jsBeautify from 'js-beautify'
import { formatTime } from '@/mixins/formatTimeMixin'
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'

export default {
  components: {
    CardTitle,
    DurationSpan
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
    hasContext() {
      return (
        this.flowRun.context && Object.keys(this.flowRun.context).length > 0
      )
    },
    hasParameters() {
      if (!this.flowRun?.parameters) return false
      return Object.keys(this.flowRun.parameters).length > 0
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

    <CardTitle v-if="hasParameters || hasContext" icon="pi-flow-run">
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
              tab == 'overview' ? 'var(--v-primary-base)' : '#fff'
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
              tab == 'parameters' ? 'var(--v-primary-base)' : '#fff'
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
              tab == 'context' ? 'var(--v-primary-base)' : '#fff'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'context'"
        >
          Context
          <v-icon small>list</v-icon>
        </v-btn>
      </div>
    </CardTitle>

    <CardTitle v-else :title="flowRun.name" icon="pi-flow-run" />

    <v-card-text class="pl-12 card-content">
      <v-fade-transition hide-on-leave>
        <div v-if="tab === 'overview'">
          <v-list-item dense class="px-0">
            <v-list-item-content>
              <v-list-item-subtitle class="caption">
                Created by
              </v-list-item-subtitle>
              <div class="subtitle-2">
                {{
                  flowRun.auto_scheduled
                    ? 'Prefect Scheduler'
                    : flowRun.created_by
                    ? flowRun.created_by.username
                    : 'Ad hoc run'
                }}
              </div>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="flowRun.state_message" dense class="px-0">
            <v-list-item-content>
              <v-list-item-subtitle class="caption">
                Last State Message
              </v-list-item-subtitle>
              <div class="subtitle-2">
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <span class="caption" v-on="on">
                      [{{ formDate(flowRun.state_timestamp) }}]:
                    </span>
                  </template>
                  <div>
                    {{ formatTime(flowRun.state_timestamp) }}
                  </div>
                </v-tooltip>
                {{ flowRun.state_message }}
              </div>
            </v-list-item-content>
          </v-list-item>

          <v-list-item dense class="pa-0">
            <v-list-item-content>
              <v-list-item-subtitle class="caption">
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
                      <template v-slot:activator="{ on }">
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
                      <template v-slot:activator="{ on }">
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
                  <v-col cols="6">
                    Ended
                  </v-col>
                  <v-col cols="6" class="text-right font-weight-bold">
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
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
                  <v-col cols="6">
                    Duration
                  </v-col>
                  <v-col cols="6" class="text-right font-weight-bold">
                    <DurationSpan
                      v-if="flowRun.start_time"
                      :start-time="flowRun.start_time"
                      :end-time="flowRun.end_time"
                    />
                    <span v-else>
                      <v-skeleton-loader type="text"></v-skeleton-loader>
                    </span>
                  </v-col>
                </v-row>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </div>
      </v-fade-transition>

      <v-fade-transition hide-on-leave>
        <div
          v-if="tab === 'parameters'"
          class="text-body-2 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-5 code-block"
        >
          {{ formatJson(flowRun.parameters) }}
        </div>
      </v-fade-transition>

      <v-fade-transition hide-on-leave>
        <div
          v-if="tab === 'context'"
          class="text-body-2 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-5 code-block"
        >
          {{ formatJson(flowRun.context) }}
        </div>
      </v-fade-transition>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.card-content {
  max-height: 254px;
  overflow-y: scroll;
}

.code-block {
  border: 1px solid #b0bec5 !important;
  font-family: 'Source Code Pro', monospace !important;
  white-space: pre-wrap;
}

.w-100 {
  width: 100% !important;
}
</style>
