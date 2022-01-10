<script>
import { mapGetters } from 'vuex'
import moment from 'moment-timezone'

const timezones = [...moment.tz.names()].map(tz => {
  return { text: tz.replace(/_/g, ' '), value: tz }
})

export default {
  props: {
    disablePast: {
      type: Boolean,
      required: false,
      default: () => true
    },
    // Two-way-bound date & time.
    // Format: ISO 8601, e.g. 2020-03-18T15:30:32-05:00
    // This prop is required for use of v-model on this component.
    value: {
      type: String,
      required: false,
      default: () => ''
    }
  },
  data() {
    return {
      // Date & time inputs
      dateTime: this.momentWithTimezone(),
      dateInterval: null,

      // Get either the user-set timezone or the resolved local timezone
      timezone_:
        this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezones: timezones,

      previousDay: null,

      // These are set to true if a user has edited the date/time fields
      // so that the counter doesn't continue to increment values
      dateChanged: false,
      timeChanged: false
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    internalValue() {
      if (!this.dateTime) return

      // format to ISO 8601,
      return this.dateTime.format()
    },
    displayDay() {
      return this.dateTime?.format('D')
    },
    displayMonth() {
      return this.dateTime?.format('MMMM')
    },
    displayYear() {
      return this.dateTime?.format('YYYY')
    },
    displayTimezone() {
      return this.dateTime?.zoneAbbr()
    },
    timezoneIcon() {
      const region = this.timezone_?.split('/')?.[0]?.toLowerCase()
      let icon
      switch (region) {
        case 'africa':
        case 'egypt':
        case 'zulu':
        case 'iran':
        case 'israel':
        case 'libya':
          icon = 'fad fa-globe-africa'
          break

        case 'asia':
        case 'australia':
        case 'pacific':
        case 'kwajalein':
        case 'hongkong':
        case 'indian':
        case 'japan':
        case 'rok':
        case 'roc':
        case 'singapore':
          icon = 'fad fa-globe-asia'
          break

        case 'america':
        case 'canada':
        case 'us':
        case 'atlantic':
        case 'brazil':
        case 'cuba':
        case 'mexico':
        case 'jamaica':
        case 'navajo':
        case 'mst':
          icon = 'fad fa-globe-americas'
          break

        case 'europe':
        case 'gb':
        case 'gb-eire':
        case 'gmt':
        case 'greenwich':
        case 'hst':
        case 'iceland':
        case 'poland':
        case 'portugal':
        case 'turkey':
        case 'met':
          icon = 'fad fa-globe-europe'
          break

        case 'universal':
          icon = 'fad fa-planet-ringed'
          break

        case 'antarctica':
          icon = 'fad fa-snowman'
          break

        case 'etc':
        default:
          icon = 'fad fa-globe'
          break
      }
      return icon
    },
    hour: {
      get() {
        return this.dateTime?.format('h')
      },
      set(val) {
        const hour =
          this.meridian == 'pm' && val < 12 ? parseInt(val) + 12 : parseInt(val)

        const dateTime = moment(this.dateTime).set({
          hour: hour
        })
        this.dateTime = this.momentWithTimezone(dateTime)
      }
    },
    minute: {
      get() {
        return this.dateTime?.format('mm')
      },
      set(val) {
        const dateTime = moment(this.dateTime).set({
          minute: val
        })
        this.dateTime = this.momentWithTimezone(dateTime)
      }
    },
    meridian: {
      get() {
        return this.dateTime?.format('a')
      },
      set(val) {
        const currentHour = this.dateTime.get('hour')
        // If the meridian is already correct, we can stop here
        if (
          (currentHour > 12 && val == 'pm') ||
          (currentHour < 12 && val == 'am')
        )
          return

        let operation

        switch (val) {
          case 'am':
            operation = 'subtract'
            break
          case 'pm':
            operation = 'add'
            break
        }

        const dateTime = moment(this.dateTime)[operation](12, 'hours')
        this.dateTime = this.momentWithTimezone(dateTime)
      }
    },
    date: {
      get() {
        return this.dateTime?.format('YYYY-MM-DD')
      },
      set(val) {
        const split = val.split('-').map(v => parseInt(v))
        // Subtract 1 from the month since the datepicker is indexed to 1
        const dateTime = moment(this.dateTime).set({
          year: split[0],
          month: split[1] - 1,
          date: split[2]
        })

        this.dateTime = this.momentWithTimezone(dateTime)
      }
    }
  },
  watch: {
    internalValue(val) {
      this.$emit('input', val)
    },
    timezone_(val) {
      this.dateTime = this.momentWithTimezone(this.dateTime)
      this.$emit('update:timezone', val)
    }
  },
  mounted() {
    this.dateTime = this.momentWithTimezone()
    this.previousDay = new moment().startOf('day').format('YYYY-MM-DD')

    this.$emit('update:timezone', this.timezone_)

    const updateCurrentDateTime = () => {
      // If both date and time have been changed, exit immediately

      if (this.dateChanged && this.timeChanged) return
      const dateTime = this.momentWithTimezone()

      if (!this.dateChanged) {
        this.date = dateTime.format('YYYY-MM-DD')
      }

      if (!this.timeChanged) {
        this.hour = dateTime.format('hh')
        this.minute = dateTime.format('mm')
        this.meridian = dateTime.format('a')
      }
    }

    this.dateInterval = setInterval(updateCurrentDateTime, 5000)
  },
  updated() {
    this.previousDay = new moment().startOf('day').format('YYYY-MM-DD')
  },
  destroyed() {
    clearInterval(this.dateInterval)
    this.dateInterval = null
  },
  methods: {
    handleChangeDate() {
      this.dateChanged = true
    },
    handleChangeTime() {
      this.timeChanged = true
    },
    momentWithTimezone(dateTime) {
      return (dateTime ? moment(dateTime) : new moment()).tz(this.timezone_)
    }
  }
}
</script>

<template>
  <v-container class="pa-0 ma-0" fluid>
    <v-row no-gutters>
      <v-col
        cols="12"
        md="4"
        class="d-flex align-center justify-start text-right"
      >
        <div
          class="pb-16 text-h5"
          :class="{
            'mx-auto': $vuetify.breakpoint.smAndDown,
            'text-center': $vuetify.breakpoint.smAndDown
          }"
        >
          <div>
            {{ displayMonth }}
            <span class="primary--text"> {{ displayDay }}</span
            >,
            {{ displayYear }}
          </div>

          <div class="text-h4">
            <span class="primary--text">{{ hour }}</span
            >:<span class="primary--text">{{ minute }} {{ meridian }} </span>
            <span class="text-h5" style="line-height: 0.9rem;"
              >({{ displayTimezone }})</span
            >
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="1" class="text-center">
        <v-divider :vertical="$vuetify.breakpoint.mdAndUp" />
      </v-col>

      <v-col cols="12" md="7">
        <v-date-picker
          v-model="date"
          no-title
          color="primary"
          class="transparent blue-grey--text text--darken-2"
          width="100%"
          :min="previousDay"
          :value="date"
          @change="handleChangeDate"
        />

        <v-row style="max-width: 290px;" class="mx-auto" no-gutters>
          <v-col cols="12" class="d-flex align-center justify-space-between">
            <v-text-field
              v-model="hour"
              type="number"
              class="mx-2"
              label="hour"
              hide-details
              outlined
              dense
              min="1"
              max="12"
              style="width: 20%;"
              @input="handleChangeTime"
            />
            <span class="text-h4">:</span>
            <v-text-field
              v-model="minute"
              type="number"
              class="mx-2"
              label="minute"
              hide-details
              outlined
              dense
              min="0"
              max="59"
              style="width: 20%;"
              @input="handleChangeTime"
            />
            <v-select
              v-model="meridian"
              class="mx-2"
              hide-details
              outlined
              dense
              label="am/pm"
              :items="['am', 'pm']"
              :append-icon="null"
              hide-no-data
              menu-props="offset-y"
              style="width: 20%;"
              @input="handleChangeTime"
            />
          </v-col>

          <v-col cols="12" class="mt-4 d-flex align-center">
            <div class="icon-placeholder mx-2">
              <v-fade-transition mode="out-in">
                <span :key="timezoneIcon">
                  <v-icon>{{ timezoneIcon }}</v-icon>
                </span>
              </v-fade-transition>
            </div>
            <v-autocomplete
              data-public
              v-model="timezone_"
              :items="timezones"
              outlined
              dense
              class="mx-2"
              hide-details
              label="Time Zone"
              :menu-props="{ contentClass: 'tz' }"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.icon-placeholder {
  height: 26px;
  width: 26px;
}
</style>

<style lang="scss">
/* stylelint-disable */
.tz.v-menu__content .v-select-list {
  max-width: 100%;
}
</style>
