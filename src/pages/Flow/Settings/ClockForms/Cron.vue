<script>
import CronClock from '@/components/Functional/CronClock'
import ExternalLink from '@/components/ExternalLink'

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
      inputs: {
        minute: null,
        hour: null,
        dayMonth: null,
        month: null,
        dayWeek: null
      },
      lastPosition: null
    }
  },
  computed: {
    inputsTotal() {
      return `${this.inputs.minute || '*'} ${this.inputs.hour || '*'} ${this
        .inputs.dayMonth || '*'} ${this.inputs.month || '*'} ${this.inputs
        .dayWeek || '*'}`
    }
  },
  watch: {
    inputsTotal(val) {
      this.$emit('input', val)
    },
    value(val) {
      const split = val?.split(' ')
      if (split?.length > 1) {
        this.inputs.minute = split[0]
        this.inputs.hour = split[1]
        this.inputs.dayMonth = split[2]
        this.inputs.month = split[3]
        this.inputs.dayWeek = split[4]
      }
    }
  },
  mounted() {
    const split = this.value?.split(' ')
    if (split?.length > 1) {
      this.inputs.minute = split[0]
      this.inputs.hour = split[1]
      this.inputs.dayMonth = split[2]
      this.inputs.month = split[3]
      this.inputs.dayWeek = split[4]
    }
  },
  methods: {
    _handleClick(e) {
      this.lastPosition = e.target.selectionStart
    },
    _handleKeypress(e) {
      const regex = /[0-9]|[a-zA-z]|[-]|[/]|[*]/gim
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
        this.inputs.minute = paste[0]
        this.inputs.hour = paste[1]
        this.inputs.dayMonth = paste[2]
        this.inputs.month = paste[3]
        this.inputs.dayWeek = paste[4]
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
      <CronClock class="text-lowercase" :cron="inputsTotal" />
    </div>

    <div class="megazord-input mt-8">
      <div class="zord text-h5">
        <input
          ref="minute"
          v-model="inputs.minute"
          type="text"
          placeholder="*"
          name="minute"
          @paste="_handlePaste"
          @click="_handleClick"
          @keypress="_handleKeypress"
          @keydown.space.prevent
          @keyup="_handleKeyup($event, 'minute')"
        />
        <label class="text-subtitle-1" for="minute">Minute</label>
      </div>

      <div class="zord text-h5">
        <input
          ref="hour"
          v-model="inputs.hour"
          type="text"
          placeholder="*"
          name="hour"
          @paste="_handlePaste"
          @click="_handleClick"
          @keypress="_handleKeypress"
          @keydown.space.prevent
          @keyup="_handleKeyup($event, 'hour')"
        />
        <label class="text-subtitle-1" for="hour">Hour</label>
      </div>

      <div class="zord text-h5">
        <input
          ref="dayMonth"
          v-model="inputs.dayMonth"
          type="text"
          placeholder="*"
          name="dayMonth"
          @paste="_handlePaste"
          @click="_handleClick"
          @keypress="_handleKeypress"
          @keydown.space.prevent
          @keyup="_handleKeyup($event, 'dayMonth')"
        />
        <label class="text-subtitle-1" for="dayMonth">
          Day (month)
        </label>
      </div>

      <div class="zord text-h5">
        <input
          ref="month"
          v-model="inputs.month"
          type="text"
          placeholder="*"
          name="month"
          @paste="_handlePaste"
          @click="_handleClick"
          @keypress="_handleKeypress"
          @keydown.space.prevent
          @keyup="_handleKeyup($event, 'month')"
        />
        <label class="text-subtitle-1" for="month">Month</label>
      </div>

      <div class="zord text-h5">
        <input
          ref="dayWeek"
          v-model="inputs.dayWeek"
          type="text"
          placeholder="*"
          name="dayWeek"
          @paste="_handlePaste"
          @click="_handleClick"
          @keypress="_handleKeypress"
          @keydown.space.prevent
          @keyup="_handleKeyup($event, 'dayWeek')"
        />
        <label class="text-subtitle-1" for="dayWeek">Day (week)</label>
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
    background-color: #eee;
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
      background-color: #333;
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
  }

  &:focus-within {
    &::after {
      width: 100%;
    }
  }
}
</style>
