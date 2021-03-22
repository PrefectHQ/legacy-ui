<script>
import CronForm from '@/pages/Flow/Settings/ClockForms/Cron'
import IntervalForm from '@/pages/Flow/Settings/ClockForms/Interval'
import SimpleForm from '@/pages/Flow/Settings/ClockForms/Simple'
// import ScheduleParamForm from '@/pages/Flow/Settings/ScheduleParamForm'
import moment from 'moment-timezone'

const timezones = [...moment.tz.names()].map(tz => {
  return { text: tz.replace(/_/g, ' '), value: tz }
})

export default {
  components: {
    CronForm,
    IntervalForm,
    SimpleForm
    // ScheduleParamForm
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
    },
    timezone: {
      type: String,
      required: false,
      default: () => null
    },
    // rename this
    param: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  data() {
    return {
      tzs: timezones,
      selectedTimezone: this.timezone,
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
      parameterModel: '', // rename this
      name: {}, // renanme this
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
        parameter_defaults:
          Object.values(this.name).length > 0
            ? JSON.stringify(this.name)
            : null,
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
            <div v-if="advancedType == 'cron'" key="Cron">
              <CronForm v-model="cronModel" :valid.sync="valid" class="mt-4" />
              <v-autocomplete
                v-model="selectedTimezone"
                :items="tzs"
                outlined
                label="Time Zone"
                style="margin-top: 110px;"
                prepend-inner-icon="access_time"
                :menu-props="{ contentClass: 'tz' }"
              />

              <!-- need to make a component for this ⬇ -->
              <v-expansion-panels multiple>
                <v-expansion-panel
                  v-for="(parameter, i) in param"
                  :key="i"
                  height="90px"
                >
                  <v-expansion-panel-header disable-icon-rotate>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="text-h6"
                          >{{ parameter.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          Default Value:
                          {{ parameter.default }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <template #actions>
                      <v-tooltip bottom>
                        <template #activator="{ on }">
                          <div v-on="on">
                            <v-btn text>
                              <v-icon small class="ml-0 mr-2">fa-undo</v-icon>
                            </v-btn>
                          </div>
                        </template>
                        <span
                          >Reset to the parameters set at flow
                          registration</span
                        >
                      </v-tooltip>
                      <v-tooltip top>
                        <template #activator="{ on, attrs }">
                          <div v-bind="attrs" v-on="on">
                            <v-btn icon
                              ><v-icon v-if="false">expand_less</v-icon
                              ><v-icon v-else>expand_more</v-icon>
                            </v-btn>
                          </div>
                        </template>
                        <span v-if="false">
                          Read-only users cannot create or edit parameters.
                        </span>
                        <span v-else>
                          Edit this parameter.
                        </span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>

                  <v-expansion-panel-content>
                    <v-col cols="12">
                      <v-row align-end>
                        <v-text-field
                          v-model="name[parameter.name]"
                          class="mx-4"
                          placeholder="Default value"
                        ></v-text-field>
                      </v-row>
                    </v-col>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>

              <!-- <ScheduleParamForm
                v-if="param.length > 0"
                :param="param"
                v-bind:title.sync="parameterModel"
              /> -->
            </div>
            <div v-else-if="advancedType == 'interval'" key="Interval">
              <IntervalForm v-model="intervalModel" class="mt-4" />

              <v-expansion-panels multiple>
                <v-expansion-panel
                  v-for="(parameter, i) in param"
                  :key="i"
                  height="90px"
                >
                  <v-expansion-panel-header disable-icon-rotate>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="text-h6"
                          >{{ parameter.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          Default Value:
                          {{ parameter.default }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <template #actions>
                      <v-tooltip bottom>
                        <template #activator="{ on }">
                          <div v-on="on">
                            <v-btn text>
                              <v-icon small class="ml-0 mr-2">fa-undo</v-icon>
                            </v-btn>
                          </div>
                        </template>
                        <span
                          >Reset to the parameters set at flow
                          registration</span
                        >
                      </v-tooltip>
                      <v-tooltip top>
                        <template #activator="{ on, attrs }">
                          <div v-bind="attrs" v-on="on">
                            <v-btn icon
                              ><v-icon v-if="false">expand_less</v-icon
                              ><v-icon v-else>expand_more</v-icon>
                            </v-btn>
                          </div>
                        </template>
                        <span v-if="false">
                          Read-only users cannot create or edit parameters.
                        </span>
                        <span v-else>
                          Edit this parameter.
                        </span>
                      </v-tooltip>
                    </template>
                  </v-expansion-panel-header>

                  <v-expansion-panel-content>
                    <v-col cols="12">
                      <v-row align-end>
                        <v-text-field
                          v-model="name[parameter.name]"
                          class="mx-4"
                          placeholder="Default value"
                        ></v-text-field>
                      </v-row>
                    </v-col>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </v-fade-transition>
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

<style>
/* stylelint-disable */
.tz.v-menu__content .v-select-list {
  max-width: 100%;
}
</style>
