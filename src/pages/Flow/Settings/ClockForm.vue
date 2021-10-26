<script>
/* eslint-disable */

import CronForm from '@/pages/Flow/Settings/ClockForms/Cron'
import IntervalForm from '@/pages/Flow/Settings/ClockForms/Interval'
import SimpleForm from '@/pages/Flow/Settings/ClockForms/Simple'
import DictInput from '@/components/CustomInputs/DictInput'

import moment from 'moment-timezone'

const timezones = [...moment.tz.names()].map(tz => {
  return { text: tz.replace(/_/g, ' '), value: tz }
})

export default {
  components: {
    CronForm,
    IntervalForm,
    SimpleForm,
    DictInput
  },
  props: {
    defaultParameters: {
      type: Array,
      required: false,
      default: () => {}
    },
    selectedTab: {
      type: [Number, String],
      required: false,
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
      parameter: {}
    }
  },
  computed: {
    allDefaultParameters() {
      if (!this.defaultParameters) return {}

      const paramObj = this.defaultParameters.reduce(
        (obj, item) => ((obj[item.name] = item.default), obj),
        {}
      )
      return this.paramVal(paramObj)
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
    },
    cancel() {
      this.$emit('cancel')
    },
    confirm() {
      const parseObject = obj => {
        if (!obj) return
        Object.keys(obj).forEach(key => {
          try {
            obj[key] = JSON.parse(obj[key])
          } catch {
            //
          }
        })
        return obj
      }
      const clockType =
        typeof this[this.clockToAdd] == 'string' ? 'CronClock' : 'IntervalClock'
      const clock = {
        type: clockType,
        [clockType == 'IntervalClock' ? 'interval' : 'cron']: this[
          this.clockToAdd
        ],
        parameter_defaults: this.parameter ? parseObject(this.parameter) : {},
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
      <div class="d-flex justify-end mb-1" style="width: 100%;">
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
        v-if="!checkDefualtParameters(allDefaultParameters)"
        class="mt-8 text-body-1"
      >
        This flow has no default parameters.
      </div>
      <DictInput
        v-else
        v-model="parameter"
        style="padding: 20px;"
        :dict="removeDoubleParam(param)"
        :default-checked-keys="
          Object.keys(param ? param : allDefaultParameters)
        "
        include-checkbox
        disable-edit
        allow-reset
      />
    </div>

    <div
      style="
      bottom: 0;
      padding: 20px;
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
