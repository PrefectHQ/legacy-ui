<script>
import { mapGetters } from 'vuex'
import moment from 'moment-timezone'
// import range from 'lodash.range'

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

      // Determine the user's timezone (-05:00, Z, etc)
      const tz = moment()
        .tz(this.timezone_)
        .format('Z')

      // If user's timezone is set...
      return (
        this.dateTime
          // format to ISO 8601,
          .format()
          // Remove timezone identifier (-05:00, Z, etc),
          .replace(/([+|-]\d{2}:\d{2})|Z$/g, '')
          // Append new timezone identifier based on user's timezone.
          .concat(tz)
      )
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
    },
    previousDay() {
      return moment(this.dateTime)
        .startOf('day')
        .format('YYYY-MM-DD')
    }
  },
  watch: {
    internalValue(val) {
      this.$emit('input', val)
    }
  },
  mounted() {
    this.dateTime = this.momentWithTimezone()

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
  <v-container fluid>
    <v-row no-gutters>
      <v-col cols="12" md="5" class="d-flex align-center justify-space-between">
        <div class="pb-16 text-h5 mx-auto">
          <div>
            {{ displayMonth }}
            <span class="primary--text"> {{ displayDay }}</span
            >,
            {{ displayYear }}
          </div>

          <div class="text-h3">
            <span class="primary--text">{{ hour }}</span
            >:<span class="primary--text">{{ minute }} {{ meridian }} </span>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="1" class="text-center">
        <v-divider :vertical="$vuetify.breakpoint.mdAndUp" />
      </v-col>

      <v-col cols="12" md="6">
        <v-date-picker
          v-model="date"
          no-title
          color="primary"
          class="transparent blue-grey--text text--darken-2"
          width="100%"
          scrollable
          :min="previousDay"
          @change="handleChangeDate"
        />

        <v-row style="max-width: 290px;" class="mx-auto" no-gutters>
          <v-col cols="12" class="d-flex align-center justify-space-between">
            <v-text-field
              v-model="hour"
              type="number"
              class="white mx-2"
              label="hour"
              hide-details
              outlined
              dense
              min="1"
              max="12"
              style="width: 20%;"
              @input="handleChangeTime"
            />
            :
            <v-text-field
              v-model="minute"
              type="number"
              class="white mx-2"
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
              class="white mx-2"
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
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
