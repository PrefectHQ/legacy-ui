<script>
import CronClock from '@/components/Functional/CronClock'
import IntervalClock from '@/components/Functional/IntervalClock'
import { daysWeek, oxfordList } from '@/utils/cron'
import { ordinal } from '@/utils/ordinal'

export default {
  components: {
    CronClock,
    IntervalClock
  },
  props: {
    value: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      interval: 'hour',
      intervalValue: 1,
      minutes: Array.from({ length: 60 }, (d, i) => i),
      hours: Array.from({ length: 24 }, (d, i) => i),
      daysWeek: Array.from({ length: 7 }, (d, i) => {
        return { label: daysWeek[i][0], value: i }
      }),
      daysMonth: Array.from({ length: 31 }, (d, i) => i + 1),
      minuteValue: 0,
      hourValue: 0,
      dayWeekValue: [1],
      dayMonthValue: [1]
    }
  },
  computed: {
    clock() {
      let cron = ''
      switch (this.interval) {
        case 'minute':
          cron = this.intervalValue * 60000000
          break
        case 'hour':
          cron = `${this.minuteValue} */${this.intervalValue} * * *`
          break
        case 'day':
          cron = `0 ${this.hourValue} */${this.intervalValue} * *`
          break
        case 'week':
          cron = `0 0 * * ${this.dayWeekValue.join(',')}`
          break
        case 'month':
          cron = `0 0 ${this.dayMonthValue.join(',')} 1/${this.intervalValue} *`
          break
        default:
          cron = '* * * * *'
          break
      }
      return cron
    },
    intervalOptions() {
      return [
        {
          label: `minute${this.intervalValue > 1 ? 's' : ''}`,
          value: 'minute',
          min: 1,
          max: 720
        },
        {
          label: `hour${this.intervalValue > 1 ? 's' : ''}`,
          value: 'hour',
          min: 1,
          max: 168
        },
        {
          label: `day${this.intervalValue > 1 ? 's' : ''}`,
          value: 'day',
          min: 1,
          max: 45
        },
        {
          label: `week${this.intervalValue > 1 ? 's' : ''}`,
          value: 'week',
          min: 1,
          max: 12
        },
        {
          label: `month${this.intervalValue > 1 ? 's' : ''}`,
          value: 'month',
          min: 1,
          max: 18
        }
      ]
    },
    intervalMin() {
      return this.intervalOptions.find(i => i.value == this.interval).min
    },
    intervalMax() {
      return this.intervalOptions.find(i => i.value == this.interval).max
    }
  },
  watch: {
    clock(val) {
      this.$emit('input', val)
    }
  },
  mounted() {
    if (!this.value) return
    console.log(this.value)
    if (typeof this.value == 'number') {
      this.interval = 'minute'
      this.intervalValue = this.value / 60000000
      return
    }

    const [minute, hour, day, month, dayWeek] = this.value.split(' ')

    if (hour.includes('*/')) {
      this.minuteValue = parseInt(minute)
      this.interval = 'hour'
      this.intervalValue = parseInt(hour.split('*/')[1])
    }

    if (day.includes('*/')) {
      this.interval = 'day'
      this.hourValue = parseInt(hour)

      this.intervalValue = parseInt(day.split('*/')[1])
    }

    if (dayWeek !== '*') {
      this.interval = 'week'
      this.dayWeekValue = dayWeek.split(',').map(v => parseInt(v))
      this.intervalValue = 1
    }

    if (month.includes('1/')) {
      this.interval = 'month'
      this.dayMonthValue = day.split(',').map(v => parseInt(v))
      this.intervalValue = parseInt(month.split('1/')[1])
    }

    console.log(minute, hour, day, month, dayWeek)
  },
  methods: {
    ordinal(val) {
      return ordinal(val)
    },
    oxfordReducer(list) {
      return [...list]
        .sort((a, b) => a - b)
        .reduce((acc, val, i, arr) => {
          return `${acc} ${val}${ordinal(val)}${oxfordList(arr, i)}`
        }, '')
    }
  }
}
</script>

<template>
  <div>
    <div class="text-body-1">
      Set a schedule for your flow; schedules set in the UI will override any in
      your Flow's code.
    </div>

    <div class="text-h4 text-center mt-8 px-8">
      <div class="text-subtitle-2">Run this flow...</div>
      <CronClock
        v-if="interval !== 'minute'"
        class="text-lowercase"
        :cron="clock"
      />
      <IntervalClock v-else class="text-lowercase" :interval="clock" />
    </div>

    <div class="d-flex align-end justify-start text-h5 my-8">
      <div>Run every</div>

      <v-text-field
        v-if="interval !== 'week'"
        v-model.number="intervalValue"
        type="number"
        class="text-h5 ml-2"
        outlined
        dense
        hide-details
        :style="{ 'max-width': intervalValue > 9 ? '75px' : '60px' }"
        :min="intervalMin"
        :max="intervalMax"
      />

      <v-select
        v-model="interval"
        :items="intervalOptions"
        class="text-h5 ml-2"
        outlined
        dense
        hide-details
        style="max-width: 150px;"
        item-text="label"
        item-value="value"
      />
    </div>

    <div
      v-if="interval == 'hour'"
      class="d-flex align-end justify-start text-h5 my-8"
    >
      <div>...on the</div>
      <v-select
        v-model="minuteValue"
        :items="minutes"
        class="text-h5 ml-2 mr-1"
        outlined
        dense
        hide-details
        style="max-width: 85px;"
      />
      <div>{{ ordinal(minuteValue) }} minute of the hour.</div>
    </div>

    <div
      v-if="interval == 'day'"
      class="d-flex align-end justify-start text-h5 my-8"
    >
      <div>...at the</div>
      <v-select
        v-model="hourValue"
        :items="hours"
        class="text-h5 ml-2 mr-1"
        outlined
        dense
        hide-details
        style="max-width: 85px;"
      />
      <div>{{ ordinal(hourValue) }} hour.</div>
    </div>

    <div v-if="interval == 'week'" class="text-h5 my-8">
      <div>Repeat on...</div>
      <v-chip-group
        v-model="dayWeekValue"
        active-class="primary darken-1"
        class="my-4"
        multiple
        mandatory
      >
        <v-chip
          v-for="day in daysWeek"
          :key="day.value"
          color="grey lighten-3"
          class="rounded-circle align-center justify-center"
          style="height: 50px;
          width: 50px;"
        >
          {{ day.label }}
        </v-chip>
      </v-chip-group>
    </div>

    <div v-if="interval == 'month'" class="text-h5 my-8">
      <div>On the...</div>

      <v-chip-group
        v-model="dayMonthValue"
        active-class="primary darken-1"
        class="my-4"
        multiple
        mandatory
        column
      >
        <v-chip
          v-for="day in daysMonth"
          :key="day"
          :value="day"
          color="grey lighten-3"
          class="rounded-circle align-center justify-center"
          style="height: 50px;
          width: 50px;"
        >
          {{ day }}
        </v-chip>
      </v-chip-group>

      <div
        >...{{ oxfordReducer(dayMonthValue) }}
        {{ dayMonthValue.length === 1 ? 'day' : 'days' }}
        of the month.
      </div>
    </div>
  </div>
</template>
