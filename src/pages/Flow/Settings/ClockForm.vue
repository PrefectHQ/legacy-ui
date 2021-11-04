<script>
/* eslint-disable */

import CronForm from '@/pages/Flow/Settings/ClockForms/Cron'
import IntervalForm from '@/pages/Flow/Settings/ClockForms/Interval'
import SimpleForm from '@/pages/Flow/Settings/ClockForms/Simple'
import ScheduleParameters from '@/pages/Flow/Settings/ScheduleParameters'
import { formatJson, isValidJson, parseJson } from '@/utils/json'

import moment from 'moment-timezone'

const timezones = [...moment.tz.names()].map(tz => {
  return { text: tz.replace(/_/g, ' '), value: tz }
})

export default {
  components: {
    CronForm,
    IntervalForm,
    SimpleForm,
    ScheduleParameters
  },
  props: {
    defaultParameters: {
      type: Array,
      required: false,
      default: () => {}
    },
    selectedTab: {
      type: [Number, String],
      required: true,
      default: () => 0
    },
    clock: {
      type: Object,
      required: false,
      default: () => {
        return {}
      }
    },
    cron: {
      type: String,
      required: false,
      default: () => '* * * * *'
    },
    interval: {
      type: [String, Number],
      required: false,
      default: () => 60000000 // Defaults to 1 minute
    },
    title: {
      type: String,
      required: false,
      default: () => 'New Schedule'
    },
    timezone: {
      type: String,
      required: false,
      default: () => null
    },
    param: {
      type: [Object, Array],
      required: false,
      default: () => null
    },
    flowGroupClocks: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  data() {
    return {
      tzs: timezones,
      selectedTimezone: this.timezone,
      simpleSelectedTimezone: this.timezone,
      advanced: false,
      // Sets the default advanced tab
      // if a certain type was specific
      // but defaults to Cron
      advancedType: this.$options.propsData?.cron
        ? 'cron'
        : this.$options.propsData?.interval
        ? 'interval'
        : 'interval',
      advancedTypes: ['cron', 'interval'],
      cronModel: this.cron,
      intervalModel: this.interval,
      simpleModel: this.clock.cron || this.clock.interval || '0 * * * *',
      valid: true,
      parameter: null
    }
  },
  created(){
    const params = this.clock?.parameter_defaults

    if (params) {
      this.parameter = this.formatParams(params)
    }
  },
  computed: {
    allDefaultParameters() {
      if (!this.defaultParameters) return {}

      return this.defaultParameters.reduce((obj, item) => {
        obj[item.name] = item.default
        return obj
      }, {})
    },
    clockToAdd() {
      return this.advanced ? `${this.advancedType}Model` : 'simpleModel'
    },
    createOrSave() {
      return Object.keys(this.clock ? this.clock : {})?.length === 0
        ? 'Create'
        : 'Save'
    }
  },
  methods: {
    checkDefaultParameters(parameterObj) {
      return Object.values(parameterObj).length > 0
    },
    formatParams(...params) {
      const combined = params.reduce(
        (result, obj) => ({ ...result, ...obj }),
        {}
      )
      return formatJson(combined)
    },
    cancel() {
      this.$emit('cancel')
    },
    confirm() {
      const clockType =
        typeof this[this.clockToAdd] == 'string' ? 'CronClock' : 'IntervalClock'
      const clock = {
        type: clockType,
        [clockType == 'IntervalClock' ? 'interval' : 'cron']: this[
          this.clockToAdd
        ],
        parameter_defaults: this.parameter != null && isValidJson(this.parameter) ? parseJson(this.parameter) : {},
        timezone: this.advanced
          ? this.selectedTimezone
          : this.simpleSelectedTimezone
      }
      this.$emit('confirm', clock)
    }
  }
}
</script>

<template>
  <div>
    <div
      class="d-flex flex-column align-start justify-start"
      style="height: 100%;width: 100%;"
    >
      <div class="d-flex justify-end mt-2" style="width: 100%;">
        <v-switch
          v-show="selectedTab === 0"
          v-model="advanced"
          inset
          label="Advanced"
          class="mt-0"
          hide-details
        ></v-switch>
      </div>

      <v-card-text
        v-show="selectedTab === 0"
        style="max-height: fill;
      overflow: auto;"
      >
        <v-fade-transition mode="out-in">
          <div
            v-if="advanced"
            key="1"
            class="mt-4 d-block"
            style="max-width: 100%;"
          >
            <v-chip-group v-model="advancedType" column mandatory>
              <v-chip
                v-for="type in advancedTypes"
                :key="type"
                active-class="primary"
                class="px-6 text-capitalize"
                label
                :value="type"
              >
                {{ type }}
              </v-chip>
            </v-chip-group>
            <v-fade-transition mode="out-in">
              <div v-if="advancedType == 'cron'" key="Cron">
                <CronForm
                  v-model="cronModel"
                  :valid.sync="valid"
                  class="mt-2"
                />
                <v-autocomplete
                  v-model="selectedTimezone"
                  :items="tzs"
                  outlined
                  label="Time Zone"
                  style="margin-top: 110px;"
                  prepend-inner-icon="access_time"
                  :menu-props="{ contentClass: 'tz' }"
                />
                <v-alert
                  v-if="flowGroupClocks.length > 0"
                  border="left"
                  colored-border
                  elevation="0"
                  type="warning"
                  dense
                  icon="warning"
                >
                  <span class="text-body-2 ma-0">
                    Setting the timezone here will take precedence over existing
                    flow group schedule timezones
                  </span>
                </v-alert>
              </div>
              <div v-else-if="advancedType == 'interval'" key="Interval">
                <IntervalForm v-model="intervalModel" class="mt-4" />
              </div>
            </v-fade-transition>
          </div>
          <div v-else key="2" class="mt-4 d-block" style="max-width: 100%;">
            <SimpleForm v-model="simpleModel" />
            <v-autocomplete
              v-if="typeof simpleModel !== 'number'"
              v-model="simpleSelectedTimezone"
              :items="tzs"
              outlined
              label="Time Zone"
              prepend-inner-icon="access_time"
              :menu-props="{ contentClass: 'tz' }"
            />
            <v-alert
              v-if="flowGroupClocks.length > 0"
              border="left"
              colored-border
              elevation="0"
              type="warning"
              dense
              icon="warning"
            >
              <span class="text-body-2 ma-0">
                Setting the timezone here will take precedence over existing
                flow group schedule timezones
              </span>
            </v-alert>
          </div>
        </v-fade-transition>
      </v-card-text>
    </div>

    <div v-show="selectedTab === 1">
      <div
        v-if="!checkDefaultParameters(allDefaultParameters)"
        class="mt-8 text-body-1"
      >
        This flow has no default parameters.
      </div>

      <div v-else>
        <p class="mt-8 text-body-1">
          Checked parameters will override their corresponding defaults for runs
          generated from this schedule.
        </p>

        <schedule-parameters
          v-model="parameter"
          style="margin: 20px;"
          :entries="formatParams(allDefaultParameters, clock.parameter_defaults)"
        />
      </div>
    </div>

    <div
      style="
      bottom: 0;
      padding: 15px;
      position: absolute;
      right: 0;
      "
    >
      <v-btn depressed class="mx-1" @click.stop="cancel">
        Cancel
      </v-btn>
      <v-btn
        depressed
        class="mx-1"
        color="primary"
        :disabled="!valid"
        @click.stop="confirm"
      >
        {{ createOrSave }}
      </v-btn>
    </div>
  </div>
</template>

<style>
/* stylelint-disable */
.tz.v-menu__content .v-select-list {
  max-width: 100%;
}
</style>
