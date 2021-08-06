<script>
import { mapGetters, mapActions } from 'vuex'

import ConfirmDialog from '@/components/ConfirmDialog'
import CronClock from '@/components/Functional/CronClock'
import ExternalLink from '@/components/ExternalLink'
import IntervalClock from '@/components/Functional/IntervalClock'
import LogRocket from 'logrocket'
import ClockForm from '@/pages/Flow/Settings/ClockForm'
import DictInput from '@/components/CustomInputs/DictInput'
import { parametersMixin } from '@/mixins/parametersMixin.js'
export default {
  components: {
    ConfirmDialog,
    CronClock,
    ExternalLink,
    IntervalClock,
    ClockForm,
    DictInput
  },
  mixins: [parametersMixin],
  props: {
    flow: { required: true, type: Object },
    flowGroup: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      cronClock: '0 0 * * * *',
      clocks: [],
      clockToRemove: null,
      error: null,
      intervalClock: 180000,
      loading: false,
      removeScheduleDialog: false,
      selectedClock: null,
      scheduleBanner: false,
      selectedTab: '',
      parameter: {}
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    ...mapGetters('license', ['hasPermission']),

    flowClocks() {
      return this.flow.schedule?.clocks.map(c => {
        // This is so we know where each clock originates while allowing us to put them in a single array
        c.scheduleType = 'flow'
        return c
      })
    },
    flowGroupClocks() {
      return this.flowGroup.schedule?.clocks.map(c => {
        // This is so we know where each clock originates while allowing us to put them in a single array
        c.scheduleType = 'flow-group'
        return c
      })
    },
    allDefaultParameters() {
      if (!this.defaultParameters) {
        return {}
      }
      const paramObj = this.defaultParameters.reduce(
        (obj, item) => ((obj[item.name] = item.default), obj),
        {}
      )
      return this.paramVal(paramObj)
    },
    hasFlowGroupSchedule() {
      return this.flowGroupClocks && this.flowGroupClocks.length > 0
    }
  },
  watch: {
    clocks() {
      this.scheduleBanner =
        !this.flow?.is_schedule_active && this.clocks.length > 0
    }
  },
  mounted() {
    this.clocks = [
      ...((this.flowGroupClocks && this.flowGroupClocks) || []),
      ...((this.flowClocks && this.flowClocks) || [])
    ]

    this.scheduleBanner =
      !this.flow?.is_schedule_active && this.clocks?.length > 0
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async createClock(val) {
      let isNew = false
      this.loading = true
      if (this.selectedClock > -1) {
        this.clocks[this.selectedClock] = {
          ...this.clocks[this.selectedClock],
          ...val
        }

        let shifted = [...this.clocks]
        shifted.unshift(shifted.splice(this.selectedClock, 1)[0])

        this.clocks = shifted
      } else {
        isNew = true
        this.clocks.push({ ...val, scheduleType: 'flow-group' })
        this.clocks = this.clocks.reverse()
      }

      await this.modifySchedules({ new: isNew })
      this.selectedClock = null
      this.loading = false
    },
    async deleteClock() {
      this.loading = true
      this.clocks = this.clocks.filter((clock, i) => i !== this.clockToRemove)
      await this.modifySchedules({ delete: true })
      this.clockToRemove = null
      this.removeScheduleDialog = false
      this.loading = false
    },
    async modifySchedules(options) {
      this.error = false

      try {
        const cronClocks = [
          ...this.clocks
            .filter(c => c.type == 'CronClock' && c.scheduleType !== 'flow')
            .map(c => {
              if (c.parameter_defaults) {
                if (
                  c.parameter_defaults === null ||
                  Object.keys(c.parameter_defaults).length === 0
                ) {
                  return {
                    cron: c.cron
                  }
                } else {
                  return {
                    cron: c.cron,
                    parameter_defaults: c.parameter_defaults
                  }
                }
              }

              return {
                cron: c.cron
              }
            })
        ]

        const intervalClocks = [
          ...this.clocks
            .filter(c => c.type == 'IntervalClock' && c.scheduleType !== 'flow')
            .map(c => {
              if (c.parameter_defaults) {
                if (
                  c.parameter_defaults === null ||
                  Object.keys(c.parameter_defaults).length === 0
                ) {
                  // input for interval clocks is seconds but are converted to
                  // microseconds at the database level so we need to
                  // convert this back to microseconds
                  return {
                    interval: c.interval / 1000000
                  }
                } else {
                  return {
                    interval: c.interval / 1000000,
                    parameter_defaults: c.parameter_defaults
                  }
                }
              }

              return {
                interval: c.interval / 1000000
              }
            })
        ]

        let result

        if (cronClocks?.length === 0 && intervalClocks?.length === 0) {
          result = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/delete-flow-group-schedule.gql'),
            variables: {
              input: {
                flow_group_id: this.flowGroup.id
              }
            }
          })
        } else {
          result = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/set-flow-group-schedule.gql'),
            variables: {
              input: {
                flow_group_id: this.flowGroup.id,
                cron_clocks: cronClocks,
                interval_clocks: intervalClocks,
                timezone: this.clocks[0]?.timezone
                  ? this.clocks[0]?.timezone
                  : this.timezone ||
                    Intl.DateTimeFormat().resolvedOptions().timeZone
              }
            }
          })
        }

        if (
          result?.data?.set_flow_group_schedule?.success ||
          result?.data?.delete_flow_group_schedule?.success
        ) {
          this.setAlert({
            alertShow: true,
            alertMessage: `Schedule ${
              options.new ? 'created' : options.delete ? 'deleted' : 'modified'
            }!`,
            alertType: 'success'
          })
        } else {
          this.error = result?.data?.set_flow_group_schedule.error
        }
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Settings - Schedules',
            stage: 'Modifying schedules'
          }
        })
        this.error = e
      }

      this.loading = false

      if (this.error) {
        this.setAlert({
          alertShow: true,
          alertMessage: `There was a problem ${
            options.new ? 'creating' : options.delete ? 'deleting' : 'modifying'
          } your schedule, please try again shortly. Error message: ${
            this.error
          }`,
          alertType: 'error'
        })
      }
    },
    timezoneVal(clock) {
      if (clock.scheduleType == 'flow') {
        return clock?.start_date?.tz || 'UTC'
      } else if (this.clocks[0] && clock.scheduleType == 'flow-group') {
        return this.clocks[0]?.timezone || this.clocks[0]?.start_date?.tz
      }

      return this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    paramVal(clock) {
      if (!clock) {
        return
      }
      let parameters = []

      for (const [key, value] of Object.entries(clock)) {
        parameters.push({ key: key, value: value, disabled: true })
      }
      return parameters
    },
    checkDefualtParameters(parameterObj) {
      return Object.values(parameterObj).length > 0
    },
    removeDoubleParam(clock) {
      if (clock && this.allDefaultParameters.length !== 0) {
        return Object.values(
          [...this.allDefaultParameters, ...this.paramVal(clock)]
            .reverse()
            .reduce((r, c) => ((r[c.key] = r[c.key] || c), r), {})
        )
      }

      if (this.allDefaultParameters.length !== 0) {
        return this.allDefaultParameters
      }
    }
  }
}
</script>

<template>
  <div style="overflow: hidden;">
    <v-banner
      key="1"
      v-model="scheduleBanner"
      icon="alarm_off"
      sticky
      single-line
      class="text-body-2 black--text py-0"
      icon-color="white"
      color="amber"
      tile
      transition="slide-y-transition"
    >
      Psst! We noticed you've got schedules here but your flow's schedule isn't
      turned on; turn it on with the toggle at the top of the page to start
      scheduling flows!
      <template #actions="{ dismiss }">
        <v-btn text color="white" @click="dismiss">Close</v-btn>
      </template>
    </v-banner>

    <div class="schedule-grid my-4">
      <div
        class="grid-container"
        :class="{ 'grid-container-large': selectedClock === -1 }"
      >
        <v-card
          v-if="hasPermission('create', 'run')"
          class="clock-card"
          :class="{ 'clock-card-large': selectedClock === -1 }"
          :style="{ 'pointer-events': selectedClock === -1 ? 'none' : 'auto' }"
          tile
          :ripple="false"
          @click.native="selectedClock = -1"
        >
          <v-card-text
            style="
            height: 100%;
            overflow: auto;
            "
            :style="{ 'pointer-events': 'auto' }"
          >
            <v-fade-transition mode="out-in">
              <div v-if="selectedClock == -1" key="1" style="height: 100%;">
                <span class="text-h5 black--text">New schedule</span>

                <v-tabs v-model="selectedTab">
                  <v-tab>Schedule</v-tab>
                  <v-tab>Parameters</v-tab>
                </v-tabs>

                <div v-show="selectedTab === 0">
                  <ClockForm
                    :flow-group-clocks="flowGroupClocks"
                    :param="parameter"
                    :timezone="
                      this.timezone ||
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                    "
                    @cancel="selectedClock = null"
                    @confirm="createClock"
                  />
                </div>
                <div v-show="selectedTab === 1">
                  <p
                    v-if="checkDefualtParameters(allDefaultParameters)"
                    class="mt-8 text-body-1"
                  >
                    Checked parameters will override their corresponding
                    defaults for runs generated from this schedule.
                  </p>

                  <DictInput
                    v-if="checkDefualtParameters(allDefaultParameters)"
                    v-model="parameter"
                    style="padding: 20px;"
                    include-checkbox
                    :dict="allDefaultParameters"
                    disable-edit
                    allow-reset
                  />
                  <div
                    v-else-if="!checkDefualtParameters(allDefaultParameters)"
                    class="mt-8 text-body-1"
                  >
                    <span class="font-weight-bold">{{ flow.name }}</span>
                    has no default parameters.
                  </div>
                </div>
              </div>
              <div
                v-else
                key="2"
                class="d-flex align-center justify-center flex-column"
                style=" cursor: pointer;
            height: 100%;
            user-select: none;"
              >
                <v-icon color="codePink" x-large>alarm_add</v-icon>

                <div class="text-h6 mt-2">New schedule</div>
              </div>
            </v-fade-transition>
          </v-card-text>
        </v-card>
      </div>

      <div
        v-for="(clock, i) in clocks"
        :key="i"
        class="grid-container"
        :class="{ 'grid-container-large': selectedClock === i }"
      >
        <v-card
          class="clock-card text-truncate"
          :class="{ 'clock-card-large': selectedClock === i }"
          color="appForeground"
          :style="{
            'border-left':
              clock.scheduleType == 'flow'
                ? '4px solid var(--v-primary-base) !important'
                : '',
            'border-left-color': 'var(--v-primary-base) !important',
            opacity:
              hasFlowGroupSchedule && clock.scheduleType == 'flow' ? '0.5' : ''
          }"
          tile
        >
          <v-fade-transition mode="out-in">
            <div
              v-if="selectedClock == i"
              key="1"
              style="height: 100%;
              overflow: auto;
              padding: 20px;
              white-space: pre-wrap;
              "
            >
              <span class="text-h5 black--text">Modify schedule</span>

              <v-tabs v-model="selectedTab">
                <v-tab>Schedule</v-tab>
                <v-tab>Parameters</v-tab>
              </v-tabs>

              <div v-show="selectedTab === 0">
                <ClockForm
                  :flow-group-clocks="flowGroupClocks"
                  :cron="clock.cron"
                  :param="parameter"
                  :interval="clock.interval"
                  :timezone="timezoneVal(clock)"
                  @cancel="selectedClock = null"
                  @confirm="createClock"
                />
              </div>
              <div v-show="selectedTab === 1">
                <div
                  v-if="!checkDefualtParameters(allDefaultParameters)"
                  class="mt-8 text-body-1"
                >
                  <span class="font-weight-bold">{{ flow.name }}</span>
                  has no default parameters.
                </div>
                <DictInput
                  v-else
                  v-model="parameter"
                  style="padding: 20px;"
                  :dict="removeDoubleParam(clock.parameter_defaults)"
                  :default-checked-keys="
                    Object.keys(
                      clock.parameter_defaults
                        ? clock.parameter_defaults
                        : allDefaultParameters
                    )
                  "
                  include-checkbox
                  disable-edit
                  allow-reset
                />
              </div>
            </div>

            <div v-else key="2" style="height: 100%;">
              <v-row
                style="height: 100%;
        white-space: pre-wrap;"
                no-gutters
              >
                <v-col cols="10" class="d-flex flex-column align-start">
                  <div
                    style="height: 90%;"
                    class="d-flex align-start justify-start pa-4 font-weight-bold text-h5"
                    no-gutters
                  >
                    <CronClock
                      v-if="clock.type == 'CronClock'"
                      :cron="clock.cron"
                      :timezone="timezoneVal(clock)"
                    />
                    <IntervalClock
                      v-else-if="clock.type == 'IntervalClock'"
                      :interval="clock.interval"
                    />
                    <div v-else>Unrecognized clock</div>
                  </div>

                  <div class="pb-3 pl-4 mt-auto">
                    <v-tooltip
                      v-if="clock.scheduleType == 'flow'"
                      max-width="300"
                      top
                    >
                      <template #activator="{ on }">
                        <v-chip
                          class="px-2 rounded-sm mr-1"
                          label
                          x-small
                          v-on="on"
                        >
                          Read-only
                        </v-chip>
                      </template>
                      This schedule was set in your Flow's code so it can't be
                      modifed.
                    </v-tooltip>

                    <v-tooltip
                      v-if="
                        clock.parameter_defaults &&
                          Object.keys(clock.parameter_defaults).length !== 0
                      "
                      max-width="200"
                      top
                    >
                      <template #activator="{ on }">
                        <v-chip
                          v-if="
                            clock.parameter_defaults &&
                              Object.keys(clock.parameter_defaults).length !== 0
                          "
                          class="px-2 rounded-sm mr-1"
                          label
                          color="codeBlue lighten-1"
                          dark
                          x-small
                          v-on="on"
                        >
                          Default parameters
                        </v-chip>
                      </template>
                      This schedule overrides default parameters.
                    </v-tooltip>

                    <v-tooltip
                      v-if="
                        hasFlowGroupSchedule && clock.scheduleType == 'flow'
                      "
                      max-width="300"
                      top
                    >
                      <template #activator="{ on }">
                        <v-chip
                          class="px-2 rounded-sm mr-1"
                          label
                          x-small
                          v-on="on"
                        >
                          Not scheduled
                        </v-chip>
                      </template>
                      The existing flow group schedule will overide this
                      schedule.
                    </v-tooltip>
                  </div>
                </v-col>
                <v-col
                  cols="2"
                  class="d-flex align-center flex-column justify-end pa-1"
                  style="
                    border-left: 1px solid var(--v-utilGrayLight-base);
                    height: 100%;"
                >
                  <v-menu
                    v-model="clock.contextMenu"
                    offset-y
                    :close-on-content-click="false"
                    open-on-hover
                  >
                    <template #activator="{ on }">
                      <div
                        class="my-1 mb-auto d-block text-decoration-none"
                        v-on="on"
                        @focus="clock.contextMenu = true"
                        @blur="clock.contextMenu = false"
                      >
                        <v-icon color="grey" small>
                          info
                        </v-icon>
                      </div>
                    </template>
                    <v-card tile class="pa-0" max-width="320">
                      <v-card-text class="pb-0">
                        <p v-if="clock.scheduleType == 'flow'">
                          <v-alert
                            border="left"
                            colored-border
                            elevation="0"
                            type="warning"
                            dense
                            icon="warning"
                            max-width="500"
                          >
                            <div class="text-body-2 ma-0"
                              >This schedule was set in your Flow's code so it
                              can't be modifed.</div
                            >

                            <div
                              v-if="hasFlowGroupSchedule"
                              class="text-body-2 ma-0 mt-2"
                            >
                              The existing flow group schedule will overide this
                              schedule.
                            </div>
                          </v-alert>
                        </p>
                        <p>
                          This schedule was created as a{{
                            'cron' in clock
                              ? ' Cron'
                              : 'date' in clock
                              ? ' Date'
                              : 'n Interval'
                          }}
                          clock with a value of
                          <span class="font-weight-bold">
                            {{ clock.cron || clock.interval || clock.date
                            }}{{ clock.interval ? ' µs' : '' }}
                          </span>
                        </p>
                        <p class="mt-1">
                          <ExternalLink
                            :href="
                              `https://docs.prefect.io/core/concepts/schedules.html#${
                                'cron' in clock
                                  ? 'cron'
                                  : 'date' in clock
                                  ? 'date'
                                  : 'interval'
                              }-clocks`
                            "
                            @click="clock.contextMenu = false"
                          >
                            Visit the docs
                          </ExternalLink>
                          to learn more about
                          {{
                            'cron' in clock
                              ? 'Cron'
                              : 'date' in clock
                              ? 'Date'
                              : 'Interval'
                          }}
                          clocks on Prefect schedules.
                        </p>
                      </v-card-text>
                      <v-card-actions class="pt-0">
                        <v-spacer></v-spacer>
                        <v-btn small text @click="clock.contextMenu = false">
                          Close
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-menu>

                  <v-tooltip
                    v-if="clock.scheduleType == 'flow-group'"
                    max-width="200"
                    :background-opacity="1"
                    left
                  >
                    <template #activator="{ on }">
                      <v-btn
                        v-if="hasPermission('update', 'run')"
                        icon
                        fab
                        class="my-1"
                        color="primary lighten-2"
                        x-small
                        @click.native="selectedClock = i"
                        v-on="on"
                      >
                        <v-icon>
                          edit
                        </v-icon>
                      </v-btn>
                    </template>
                    Modify this schedule
                  </v-tooltip>

                  <v-tooltip
                    v-if="clock.scheduleType == 'flow-group'"
                    max-width="300"
                    :background-opacity="1"
                    left
                  >
                    <template #activator="{ on }">
                      <v-btn
                        v-if="hasPermission('delete', 'run')"
                        icon
                        fab
                        class="mt-1"
                        color="red lighten-2"
                        x-small
                        @click.native="
                          removeScheduleDialog = true
                          clockToRemove = i
                        "
                        v-on="on"
                      >
                        <v-icon>
                          delete
                        </v-icon>
                      </v-btn>
                    </template>
                    Remove this schedule
                  </v-tooltip>
                </v-col>
              </v-row>
            </div>
          </v-fade-transition>
        </v-card>
      </div>

      <ConfirmDialog
        v-model="removeScheduleDialog"
        type="error"
        :dialog-props="{ 'max-width': '500' }"
        :disabled="loading"
        :loading="loading"
        title="Remove schedule"
        @cancel="clockToRemove = null"
        @confirm="deleteClock"
      >
        You can always recreate this schedule later.
      </ConfirmDialog>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$cellsize: 225px;
$guttersize: 24px;

.schedule-grid {
  column-gap: $guttersize;
  display: grid;
  grid-auto-flow: dense;
  grid-auto-rows: $cellsize;
  grid-template-columns: repeat(auto-fill, $cellsize);
  justify-content: center;
  row-gap: $guttersize;
}

.grid-container {
  grid-column: span 1;
  grid-row: span 1;
  overflow: visible;
  position: relative;

  &.grid-container-large {
    grid-column: span 3;
    grid-row: span 3;
  }
}

.clock-card {
  height: 100%;
  left: 0;
  max-height: $cellsize + $guttersize;
  max-width: $cellsize + $guttersize;
  min-height: $cellsize;
  min-width: $cellsize;
  position: absolute;
  top: 0;
  transition: all 250ms;
  width: 100%;

  &.clock-card-large {
    max-height: $cellsize * 3 + $guttersize * 3;
    max-width: $cellsize * 3 + $guttersize * 3;
    min-height: $cellsize * 3;
    min-width: $cellsize * 3;
  }
}
</style>
