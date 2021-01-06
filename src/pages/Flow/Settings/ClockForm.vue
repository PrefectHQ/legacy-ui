<script>
import CronForm from '@/pages/Flow/Settings/ClockForms/Cron'
import IntervalForm from '@/pages/Flow/Settings/ClockForms/Interval'
import SimpleForm from '@/pages/Flow/Settings/ClockForms/Simple'
import moment from 'moment-timezone'

export default {
  components: {
    CronForm,
    IntervalForm,
    SimpleForm
  },
  props: {
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
    }
  },
  data() {
    return {
      tzs: [...moment.tz.names()],
      selectedTimezone: null,
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
      simpleModel: '0 * * * *',
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
      const clockType =
        typeof this[this.clockToAdd] == 'string' ? 'CronClock' : 'IntervalClock'

      const clock = {
        type: clockType,
        [clockType == 'IntervalClock' ? 'interval' : 'cron']: this[
          this.clockToAdd
        ],
        timezone: this.selectedTimezone
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
    <div
      class="d-flex justify-space-between align-start mb-1"
      style="width: 100%;"
    >
      <span class="text-h5 black--text">{{ title }}</span>

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
      overflow: scroll;"
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
            <CronForm
              v-if="advancedType == 'cron'"
              key="Cron"
              v-model="cronModel"
              :valid.sync="valid"
              class="mt-4"
            />
            <IntervalForm
              v-else-if="advancedType == 'interval'"
              key="Interval"
              v-model="intervalModel"
              class="mt-4"
            />
          </v-fade-transition>

          <v-select
            v-if="advancedType == 'cron'"
            v-model="selectedTimezone"
            style="margin-top: 120px;"
            :items="tzs"
            label="Time Zone (Optional)"
            prepend-inner-icon="access_time"
          ></v-select>
        </div>
        <div v-else key="2" class="mt-4 d-block" style="max-width: 100%;">
          <SimpleForm v-model="simpleModel" />
        </div>
      </v-fade-transition>
    </v-card-text>

    <div class="mt-auto text-right w-100">
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
