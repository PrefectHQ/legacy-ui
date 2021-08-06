<script>
/* eslint-disable */

import CronForm from '@/pages/Flow/Settings/ClockForms/Cron'
import IntervalForm from '@/pages/Flow/Settings/ClockForms/Interval'
import SimpleForm from '@/pages/Flow/Settings/ClockForms/Simple'
import moment from 'moment-timezone'

const timezones = [...moment.tz.names()].map(tz => {
  return { text: tz.replace(/_/g, ' '), value: tz }
})

export default {
  components: {
    CronForm,
    IntervalForm,
    SimpleForm
  },
  props: {
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
      type: Object,
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
      valid: true
    }
  },
  computed: {
    clockToAdd() {
      return this.advanced ? `${this.advancedType}Model` : 'simpleModel'
    }
  },
  methods: {
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
        parameter_defaults: this.param ? parseObject(this.param) : {},
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
  <v-container
    class="d-flex flex-column align-start justify-start"
    style="height: 100%;
    width: 100%;"
  >
    <div class="d-flex justify-end mb-1" style="width: 100%;">
      <v-switch
        v-model="advanced"
        inset
        label="Advanced"
        class="mt-0"
        hide-details
      ></v-switch>
    </div>
    <v-card-text
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
              <CronForm v-model="cronModel" :valid.sync="valid" class="mt-2" />
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
              Setting the timezone here will take precedence over existing flow
              group schedule timezones
            </span>
          </v-alert>
        </div>
      </v-fade-transition>
    </v-card-text>

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
        Create
      </v-btn>
    </div>
  </v-container>
</template>

<style>
/* stylelint-disable */
.tz.v-menu__content .v-select-list {
  max-width: 100%;
}
</style>
