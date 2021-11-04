<script>
import IntervalClock from '@/components/Functional/IntervalClock'
import ExternalLink from '@/components/ExternalLink'
import debounce from 'lodash/debounce'

export default {
  components: {
    ExternalLink,
    IntervalClock
  },
  props: {
    value: {
      type: [Number, String],
      required: true
    }
  },
  data() {
    return {
      infoMessage: null,
      interval: this.value / 1000000
    }
  },
  computed: {
    _handleInput: function() {
      return debounce(this._rawHandleInput, 500)
    }
  },
  watch: {
    interval(val) {
      this.$emit('input', val * 1000000)
    }
  },
  methods: {
    _rawHandleInput() {
      if (this.interval < 60) {
        this.infoMessage = 'Schedule intervals cannot be lower than 60 seconds.'
      } else if (this.interval > 2147483647) {
        this.infoMessage =
          'Schedule intervals cannot be higher than 2,147,483,647 seconds.'
      } else {
        this.infoMessage = null
      }
    },
    decrement() {
      this.interval > 60 && this.interval--
    },
    increment() {
      // 32 bit limitation
      this.interval < 2147483647 && this.interval++
    }
  }
}
</script>

<template>
  <div>
    <div class="text-body-1"
      >Manually set your schedule's interval. For more information, read about
      interval clocks in
      <ExternalLink
        href="https://docs.prefect.io/core/concepts/schedules.html#interval-clocks"
      >
        the Prefect docs</ExternalLink
      >.
    </div>

    <div class="text-h4 text-center mt-8 px-8">
      <div class="text-subtitle-2">Run this flow...</div>
      <IntervalClock class="text-lowercase" :interval="value" />
    </div>

    <v-slide-y-transition mode="out-in">
      <v-alert
        v-if="infoMessage"
        class="mx-auto my-4 text-body-2"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        icon="announcement"
        max-width="500"
      >
        <p>
          {{ infoMessage }}
        </p>

        <p class="mt-4 mb-0">
          You can read more about schedules in
          <ExternalLink
            href="https://docs.prefect.io/core/concepts/schedules.html#clocks"
          >
            the Prefect docs</ExternalLink
          >.
        </p>
      </v-alert>
    </v-slide-y-transition>

    <div class="d-flex align-center justify-center mt-8">
      <v-icon :disabled="interval <= 60" @click="decrement">
        remove_circle
      </v-icon>

      <v-text-field
        v-model.number="interval"
        class="text-h5 center hidden-spin"
        label="Seconds"
        style="max-width: 200px;"
        type="number"
        min="60"
        max="2147483647"
        @keyup="_handleInput"
      />
      <v-icon :disabled="interval >= 2147483647" @click="increment">
        add_circle
      </v-icon>
    </div>
  </div>
</template>

<style lang="scss">
// stylelint-disable
.hidden-spin {
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }
}
// stylelint-enable

// stylelint-disable
.center.v-input {
  input {
    text-align: center !important;
  }

  label {
    left: 50% !important;
    right: unset !important;
    top: 0 !important;
    transform: translate(-50%, -18px) scale(0.75) !important;
    transform-origin: center !important;
  }
}
// stylelint-enable
</style>
