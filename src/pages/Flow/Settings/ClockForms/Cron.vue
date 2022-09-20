<script>
import CronClock from '@/components/Functional/CronClock'
import ExternalLink from '@/components/ExternalLink'

/* eslint-disable no-unused-vars */
import {
  CRON_MINUTE_REGEX as minute,
  CRON_HOUR_REGEX as hour,
  CRON_DAY_MONTH_REGEX as dayMonth,
  CRON_MONTH_REGEX as month,
  CRON_DAY_WEEK_REGEX as dayWeek
} from '@/utils/regEx'

const inputs = ['minute', 'hour', 'dayMonth', 'month', 'dayWeek']

export default {
  components: {
    CronClock,
    ExternalLink
  },
  props: {
    value: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      lastPosition: null,

      // Inputs (in order)
      minute: '*',
      hour: '*',
      dayMonth: '*',
      month: '*',
      dayWeek: '*'
    }
  },
  computed: {
    inputsTotal() {
      return `${this.minute} ${this.hour} ${this.dayMonth} ${this.month} ${this.dayWeek}`
    },
    valid() {
      return (
        this.minuteValid &&
        this.hourValid &&
        this.dayMonthValid &&
        this.monthValid &&
        this.dayWeekValid
      )
    },

    // Input validity (in order)
    minuteValid() {
      return minute.test(this.minute)
    },
    hourValid() {
      return hour.test(this.hour)
    },
    dayMonthValid() {
      return dayMonth.test(this.dayMonth)
    },
    monthValid() {
      return month.test(this.month)
    },
    dayWeekValid() {
      return dayWeek.test(this.dayWeek)
    }
  },
  watch: {
    inputsTotal(val) {
      this.$emit('input', val)
    },
    valid(val) {
      this.$emit('update:valid', val)
    },
    value(val) {
      const split = val?.split(' ')
      if (split?.length > 1) {
        this.minute = split[0]
        this.hour = split[1]
        this.dayMonth = split[2]
        this.month = split[3]
        this.dayWeek = split[4]
      }
    }
  },
  mounted() {
    const split = this.value?.split(' ')
    if (split?.length > 1) {
      this.minute = split[0]
      this.hour = split[1]
      this.dayMonth = split[2]
      this.month = split[3]
      this.dayWeek = split[4]
    }
  },
  beforeDestroy() {
    this.$emit('update:valid', true)
  },
  methods: {
    _handleClick(e) {
      this.lastPosition = e.target.selectionStart
    },
    _handleKeypress(e) {
      const regex = /[0-9]|[a-zA-Z]|[-]|[/]|[,]|[*]|[#]/i
      !regex.test(e.key) && e.preventDefault()
    },
    _handleKeyup(e, source) {
      const next = inputs.findIndex(c => c == source) + 1
      const prev = inputs.findIndex(c => c == source) - 1
      const position = e.target.selectionStart

      if (
        this.lastPosition !== 0 &&
        this.lastPosition !== e.target.value.length
      ) {
        this.lastPosition = position
        return
      }

      this.lastPosition = position

      switch (e.code) {
        case 'ArrowRight':
        case 'Space':
          if (next > 4 || position < e.target.value.length) break
          if (this.lastPosition !== e.target.value.length) break
          this.$refs[inputs[next]].focus()
          this.lastPosition = 0
          break
        case 'ArrowLeft':
          if (prev < 0 || position > 0) break
          if (this.lastPosition !== 0) break
          this.$refs[inputs[prev]].focus()
          this.lastPosition = this.$refs[inputs[prev]]?.value?.length || 0
          break
        default:
          break
      }
    },
    _handlePaste(e) {
      const paste = e.clipboardData.getData('text')?.split(' ')
      if (paste?.length > 1) {
        this.minute = paste[0]
        this.hour = paste[1]
        this.dayMonth = paste[2]
        this.month = paste[3]
        this.dayWeek = paste[4]
        e.preventDefault()
      }
    }
  }
}
</script>

<template>
  <div>
    <div class="text-body-1"
      >Manually set your schedule's cron string. For more information, read
      about
      <ExternalLink href="https://en.wikipedia.org/wiki/Cron#CRON_expression">
        cron expressions
      </ExternalLink>
      or about
      <ExternalLink
        href="https://docs.prefect.io/core/concepts/schedules.html#cron-clocks"
      >
        cron clocks in Prefect </ExternalLink
      >.
    </div>

    <div class="text-h4 text-center mt-8 px-8">
      <div class="text-subtitle-2">Run this flow...</div>
      <CronClock v-if="valid" class="text-lowercase" :cron="inputsTotal" />
      <span v-else class="primary--text">Invalid input</span>
    </div>

    <div class="megazord-input mt-8">
      <div class="zord text-h5">
        <input
          ref="minute"
          v-model="minute"
          type="text"
          placeholder="*"
          name="minute"
          @paste="_handlePaste"
          @click="_handleClick"
          @keypress="_handleKeypress"
          @keydown.space.prevent
          @keyup="_handleKeyup($event, 'minute')"
        />
        <label
          class="text-subtitle-1"
          :class="{ invalid: !minuteValid }"
          for="minute"
        >
          Minute
        </label>
      </div>

      <div class="zord text-h5">
        <input
          ref="hour"
          v-model="hour"
          type="text"
          placeholder="*"
          name="hour"
          @paste="_handlePaste"
          @click="_handleClick"
          @keypress="_handleKeypress"
          @keydown.space.prevent
          @keyup="_handleKeyup($event, 'hour')"
        />
        <label
          class="text-subtitle-1"
          :class="{ invalid: !hourValid }"
          for="hour"
        >
          Hour
        </label>
      </div>

      <div class="zord text-h5">
        <input
          ref="dayMonth"
          v-model="dayMonth"
          type="text"
          placeholder="*"
          name="dayMonth"
          @paste="_handlePaste"
          @click="_handleClick"
          @keypress="_handleKeypress"
          @keydown.space.prevent
          @keyup="_handleKeyup($event, 'dayMonth')"
        />
        <label
          class="text-subtitle-1"
          :class="{ invalid: !dayMonthValid }"
          for="dayMonth"
        >
          Day (month)
        </label>
      </div>

      <div class="zord text-h5">
        <input
          ref="month"
          v-model="month"
          type="text"
          placeholder="*"
          name="month"
          @paste="_handlePaste"
          @click="_handleClick"
          @keypress="_handleKeypress"
          @keydown.space.prevent
          @keyup="_handleKeyup($event, 'month')"
        />
        <label
          class="text-subtitle-1"
          :class="{ invalid: !monthValid }"
          for="month"
        >
          Month
        </label>
      </div>

      <div class="zord text-h5">
        <input
          ref="dayWeek"
          v-model="dayWeek"
          type="text"
          placeholder="*"
          name="dayWeek"
          @paste="_handlePaste"
          @click="_handleClick"
          @keypress="_handleKeypress"
          @keydown.space.prevent
          @keyup="_handleKeyup($event, 'dayWeek')"
        />
        <label
          class="text-subtitle-1"
          :class="{ invalid: !dayWeekValid }"
          for="dayWeek"
        >
          Day (week)
        </label>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.megazord-input {
  align-content: center;
  display: flex;
  justify-content: space-around;
  margin-bottom: 50px;
  max-width: 100%;
  position: relative;

  &::before {
    background-color: var(--v-utilGrayLight-base);
    bottom: -4px;
    content: '';
    display: block;
    height: 1px;
    position: absolute;
    transition: all 150ms;
    width: 100%;
  }

  &:hover,
  &:focus {
    &::before {
      background-color: var(--v-utilGrayDark-base);
    }
  }

  &::after {
    background-color: var(--v-primary-base);
    bottom: -4px;
    content: '';
    display: block;
    height: 2px;
    position: absolute;
    transition: width 150ms;
    width: 0;
  }

  .zord {
    padding: 0;
    position: relative;

    input {
      text-align: center;
      width: 100%;

      // stylelint-disable a11y/no-outline-none
      &:focus {
        outline: none;
      }
      // stylelint-enable a11y/no-outline-none
    }

    label {
      left: 50%;
      margin: auto;
      position: absolute;
      text-align: center;
      top: 35px;
      transform: translate(-50%);
    }

    &:focus-within {
      label {
        color: var(--v-primary-base);
      }
    }

    .invalid {
      animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      color: var(--v-error-base) !important;
      transform: translate(-50%) translate3d(0, 0, 0);
    }

    @keyframes shake {
      10%,
      90% {
        transform: translate(-50%) translate3d(-1px, 0, 0);
      }

      20%,
      80% {
        transform: translate(-50%) translate3d(2px, 0, 0);
      }

      30%,
      50%,
      70% {
        transform: translate(-50%) translate3d(-4px, 0, 0);
      }

      40%,
      60% {
        transform: translate(-50%) translate3d(4px, 0, 0);
      }
    }
  }

  &:focus-within {
    &::after {
      width: 100%;
    }
  }
}
</style>
