<script>
import { mapGetters } from 'vuex'
import moment from 'moment-timezone'
import range from 'lodash/range'

export default {
  props: {
    // Specify a warning to display if the selected time is in the past.
    warning: {
      type: String,
      required: false,
      default: () => 'This time is in the past.'
    },
    // Custom props for the read-only text field displaying the selected date and time.
    textFieldProps: {
      type: Object,
      required: false,
      default: () => ({})
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
      date: null,
      timeHr: '12',
      timeMin: '00',
      timeAmPm: 'AM',

      // Tab control
      tab: 'date',

      // Menu control
      showMenu: false,

      // Current date & time
      currentDateTimeMoment: null
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    // The current date in YYYY-MM-DD format
    currentDate() {
      if (!this.currentDateTimeMoment) return null
      return this.currentDateTimeMoment.format('YYYY-MM-DD')
    },
    // Selected date and time value, as derived from date & time inputs.
    // Format: ISO 8601, e.g. 2020-03-18T15:30:32-05:00
    internalValue() {
      if (!this.date) return null

      const selectedDateTime = moment(
        `${this.date} ${this.timeHr}:${this.timeMin} ${this.timeAmPm}`,
        'YYYY-MM-DD hh:mm A'
      )
      // If user's timezone is not set, format to ISO 8601 and return.
      if (!this.timezone) return selectedDateTime.format()

      // Determine the user's timezone (-05:00, Z, etc)
      const tz = moment()
        .tz(this.timezone)
        .format('Z')

      // If user's timezone is set...
      return (
        selectedDateTime
          // format to ISO 8601,
          .format()
          // Remove timezone identifier (-05:00, Z, etc),
          .replace(/([+|-]\d{2}:\d{2})|Z$/g, '')
          // Append new timezone identifier based on user's timezone.
          .concat(tz)
      )
    },
    // Format the selected date & time to be more human-readable.
    formattedValue() {
      if (!this.internalValue) return null

      const formattedDateTime = this.momentWithTimezone(
        this.internalValue
      ).format('MMMM D YYYY [at] h:mm A')

      const formattedTimezone = this.timezone
        ? moment()
            .tz(
              this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
            )
            .zoneAbbr()
        : ''

      return `${formattedDateTime} ${formattedTimezone}`
    },
    timeInPast() {
      if (!this.internalValue) return false
      return moment(this.internalValue) < this.currentDateTimeMoment
    }
  },
  watch: {
    // Whenever internalValue changes, it should be emitted to the parent.
    // This input emitter is what makes v-model work on the DateTime component.
    internalValue(val) {
      this.$emit('input', val)
    },
    // Keep the constituent parts of DateTime in sync with the user-provided value prop.
    value(val) {
      if (val) {
        const valueMoment = this.momentWithTimezone(val)
        this.date = valueMoment.format('YYYY-MM-DD')
        this.timeHr = valueMoment.format('hh')
        this.timeMin = valueMoment.format('mm')
        this.timeAmPm = valueMoment.format('A')
      } else {
        this.handleDateTimeClear()
      }
    }
  },
  created() {
    this.currentDateTimeMoment = this.timezone
      ? moment().tz(this.timezone)
      : moment()

    setInterval(() => {
      this.currentDateTimeMoment = this.timezone
        ? moment().tz(this.timezone)
        : moment()
    }, 5000)
  },
  methods: {
    handleDateChange(input) {
      this.date = input
      this.tab = 'time'

      let currentDateTime = this.momentWithTimezone()

      currentDateTime.add(1, 'minute')

      if (this.date === currentDateTime.format('YYYY-MM-DD')) {
        // If selected date is current day,
        // set time input values as the current time + 1 minute.
        this.timeHr = currentDateTime.format('hh')
        this.timeMin = currentDateTime.format('mm')
        this.timeAmPm = currentDateTime.format('A')
      } else {
        // If selected day is in the future,
        // initialize start time as midnight.
        this.timeHr = '12'
        this.timeMin = '00'
        this.timeAmPm = 'AM'
      }
    },
    handleDateTimeClear() {
      this.tab = 'date'

      this.date = null
      this.timeHr = '12'
      this.timeMin = '00'
      this.timeAmPm = 'AM'
    },
    // Given the date & time as a string,
    // provide a moment object that accounts for timezone.
    // Leave argument blank if you want to use the current time.
    momentWithTimezone(dateTime) {
      return this.timezone
        ? moment(dateTime).tz(this.timezone)
        : moment(dateTime)
    },
    timeRange(min, max) {
      return range(min, max).map(val => {
        if (val < 10) return `0${val}`
        return val.toString()
      })
    }
  }
}
</script>

<template>
  <div>
    <v-menu
      v-model="showMenu"
      max-width="290"
      offset-y
      :close-on-content-click="false"
    >
      <template #activator="{ on }">
        <v-text-field
          :value="formattedValue"
          clearable
          readonly
          v-bind="textFieldProps"
          v-on="on"
          @click:clear="handleDateTimeClear"
        ></v-text-field>
      </template>
      <v-tabs v-model="tab" grow class="tab-height-custom">
        <v-tab key="date" href="#date">Date</v-tab>
        <v-tab key="time" href="#time" :disabled="!date">
          Time
        </v-tab>

        <v-tab-item value="date">
          <v-date-picker
            v-model="date"
            no-title
            :min="currentDate"
            label="Hour"
            @change="handleDateChange"
          ></v-date-picker>
        </v-tab-item>

        <v-tab-item value="time">
          <v-card tile>
            <v-card-text>
              <v-row>
                <v-col cols="4">
                  <v-autocomplete
                    v-model="timeHr"
                    hide-details
                    label="Hour"
                    :items="timeRange(1, 13)"
                    :append-icon="null"
                    hide-no-data
                  ></v-autocomplete>
                </v-col>
                <v-col cols="4">
                  <v-autocomplete
                    v-model="timeMin"
                    hide-details
                    label="Minute"
                    :items="timeRange(0, 60)"
                    :append-icon="null"
                    hide-no-data
                  ></v-autocomplete>
                </v-col>
                <v-col cols="4">
                  <v-autocomplete
                    v-model="timeAmPm"
                    hide-details
                    label="AM/PM"
                    :items="['AM', 'PM']"
                    :append-icon="null"
                    hide-no-data
                  ></v-autocomplete>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <p>Timezone: {{ timezone || 'Local' }}</p>
                  <p class="mb-0">
                    You can change your system's timezone from your user
                    profile.
                    <router-link :to="'/user/profile'">
                      Update timezone
                    </router-link>
                    .
                  </p>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" class="py-0">
                  <v-scroll-x-transition>
                    <v-alert
                      v-if="timeInPast"
                      border="left"
                      colored-border
                      elevation="2"
                      type="warning"
                      dense
                      class="mt-4 mb-0"
                    >
                      <span class="text-body-2 ma-0">
                        {{ warning }}
                      </span>
                    </v-alert>
                  </v-scroll-x-transition>
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-actions class="pa-0">
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="showMenu = false">
                Confirm
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-tab-item>
      </v-tabs>
    </v-menu>
  </div>
</template>
