<script>
import { mapActions } from 'vuex'

import ConfirmDialog from '@/components/ConfirmDialog'
import CronClock from '@/components/Functional/CronClock'
import IntervalClock from '@/components/Functional/IntervalClock'
import LogRocket from 'logrocket'
import ClockForm from '@/pages/Flow/Settings/ClockForm'

export default {
  components: {
    ConfirmDialog,
    CronClock,
    IntervalClock,
    ClockForm
  },
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
      selectedClock: null
    }
  },
  computed: {
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
    }
  },
  mounted() {
    this.clocks = [
      ...((this.flowGroupClocks && this.flowGroupClocks) || []),
      ...((this.flowClocks && this.flowClocks) || [])
    ]
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
      } else {
        isNew = true
        this.clocks.push({ ...val, scheduleType: 'flow-group' })
      }

      await this.modifySchedules(isNew)
      this.selectedClock = null
      this.loading = false
    },
    async deleteClock() {
      this.loading = true
      this.clocks = this.clocks.filter((clock, i) => i !== this.clockToRemove)
      await this.modifySchedules()
      this.clockToRemove = null
      this.removeScheduleDialog = false
      this.loading = false
    },
    async modifySchedules(isNew) {
      this.error = false

      try {
        const cronClocks = [
          ...this.clocks
            .filter(c => c.type == 'CronClock' && c.scheduleType !== 'flow')
            .map(c => {
              return {
                cron: c.cron,
                parameter_defaults: c.parameter_defaults
              }
            })
        ]

        const intervalClocks = [
          ...this.clocks
            .filter(c => c.type == 'IntervalClock' && c.scheduleType !== 'flow')
            .map(c => {
              return {
                // input for interval clocks is seconds but are converted to
                // microseconds at the database level so we need to
                // convert this back to microseconds
                interval: c.interval / 1000000,
                parameter_defaults: c.parameter_defaults
              }
            })
        ]

        const result = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/set-flow-group-schedule.gql'),
          variables: {
            input: {
              flow_group_id: this.flowGroup.id,
              cron_clocks: cronClocks,
              interval_clocks: intervalClocks
            }
          }
        })

        if (result?.data?.set_flow_group_schedule?.success) {
          this.setAlert({
            alertShow: true,
            alertMessage: `Schedule ${isNew ? 'created' : 'modified'}!`,
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
            isNew ? 'creating' : 'modifying'
          } your schedule, please try again shortly.`,
          alertType: 'error'
        })
      }
    }
  }
}
</script>

<template>
  <div class="schedule-grid my-4">
    <v-card
      class="clock-card"
      :class="{ 'clock-card-large': selectedClock === -1 }"
      :style="{ 'pointer-events': selectedClock === -1 ? 'none' : 'auto' }"
      tile
      :ripple="false"
      @click.native="selectedClock = -1"
    >
      <v-card-text style="height: 100%;" :style="{ 'pointer-events': 'auto' }">
        <v-fade-transition mode="out-in">
          <div v-if="selectedClock == -1" key="1" style="height: 100%;">
            <ClockForm
              title="New schedule"
              @cancel="selectedClock = null"
              @confirm="createClock"
            />
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

    <v-card
      v-for="(clock, i) in clocks"
      :key="i"
      class="clock-card text-truncate"
      :class="{ 'clock-card-large': selectedClock === i }"
      :color="clock.scheduleType == 'flow' ? 'grey lighten-4' : 'white'"
      :style="{
        'border-left':
          clock.scheduleType == 'flow'
            ? '4px solid var(--v-primary-base) !important'
            : '',
        'border-left-color': 'var(--v-primary-base) !important'
      }"
      tile
    >
      <v-fade-transition mode="out-in">
        <div
          v-if="selectedClock == i"
          key="1"
          style="height: 100%;
        white-space: pre-wrap;"
        >
          <ClockForm
            :cron="clock.cron"
            :interval="clock.interval"
            title="Modify schedule"
            @cancel="selectedClock = null"
            @confirm="createClock"
          />
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
                  <template v-slot:activator="{ on }">
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
                  v-if="'parameter_defaults' in clock"
                  max-width="200"
                  top
                >
                  <template v-slot:activator="{ on }">
                    <v-chip
                      v-if="'parameter_defaults' in clock"
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
              </div>
            </v-col>
            <v-col
              cols="2"
              class="d-flex align-center flex-column justify-end pa-1 my-auto"
              style="border-left: 1px solid #eee;
          height: 90%;"
            >
              <v-tooltip max-width="300" :background-opacity="1" left>
                <template v-slot:activator="{ on }">
                  <a
                    class="my-1 mb-auto d-block text-decoration-none"
                    :href="
                      `https://docs.prefect.io/core/concepts/schedules.html#${
                        'cron' in clock
                          ? 'cron'
                          : 'date' in clock
                          ? 'date'
                          : 'interval'
                      }-clocks`
                    "
                    target="_blank"
                    v-on="on"
                  >
                    <v-icon color="grey" small>
                      info
                    </v-icon>
                  </a>
                </template>
                <div>
                  <div v-if="clock.scheduleType == 'flow'" class="text-h6 mb-4">
                    This schedule was set in your Flow's code so it can't be
                    modifed.
                  </div>
                  <div>
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
                  </div>
                  <div class="mt-1">
                    Click to learn more about
                    {{
                      'cron' in clock
                        ? 'Cron'
                        : 'date' in clock
                        ? 'Date'
                        : 'Interval'
                    }}
                    clocks on Prefect schedules.
                  </div>
                </div>
              </v-tooltip>

              <v-tooltip
                v-if="clock.scheduleType == 'flow-group'"
                max-width="200"
                :background-opacity="1"
                left
              >
                <template v-slot:activator="{ on }">
                  <v-btn
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
                <template v-slot:activator="{ on }">
                  <v-btn
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
      This will remove any future runs that were based on this schedule (you can
      always recreate this later).
    </ConfirmDialog>
  </div>
</template>

<style lang="scss" scoped>
.schedule-grid {
  column-gap: 24px;
  display: grid;
  grid-auto-flow: dense;
  grid-auto-rows: 225px;
  grid-template-columns: repeat(auto-fill, 225px);
  justify-content: center;
  row-gap: 24px;
}

.clock-card {
  animation-direction: normal;
  animation-duration: 750ms;
  animation-fill-mode: forwards;
  animation-name: grid-transition;

  height: 100%;
  max-height: 225px;
  max-width: 225px;
  min-height: 225px;
  min-width: 225px;
  position: relative;
  transition: all 500ms;
  width: 100%;

  &.clock-card-large {
    animation-name: unset;

    grid-column: span 3;
    grid-row: span 3;
    max-height: 1000px;
    max-width: 1000px;
  }
}

@keyframes grid-transition {
  to {
    grid-column: span 1;
    grid-row: span 1;
  }
}
</style>
