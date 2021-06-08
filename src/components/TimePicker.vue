<script>
export default {
  props: {
    placeholder: {
      type: String,
      required: false,
      default: '12:00:00'
    },
    value: {
      type: Date,
      required: false,
      default: () => new Date()
    }
  },
  data() {
    return {
      hour: this.value.getHours(),
      minute: this.value.getMinutes(),
      second: this.value.getSeconds(),
      value_: new Date(this.value)
    }
  },
  computed: {
    hourPlaceholder() {
      return this.placeholder.split(':')[0]
    },
    minutePlaceholder() {
      return this.placeholder.split(':')[1]
    },
    secondPlaceholder() {
      return this.placeholder.split(':')[2]
    }
  },
  mounted() {
    console.log(this.hour, this.minute, this.second)
    this.$watch(
      vm => [vm.hour, vm.minute, vm.second],
      val => {
        const [hour, minute, second] = val

        if (hour < 0) this.hour = 0
        if (hour > 23) this.hour = 23
        if (minute < 0) this.minute = 0
        if (minute > 59) this.minute = 59
        if (second < 0) this.second = 0
        if (second > 59) this.second = 59

        this.value_.setHours(this.hour)
        this.value_.setMinutes(this.minutes)
        this.value_.setSeconds(this.seconds)

        this.$emit('update', this.value_)
      },
      {
        immediate: true
      }
    )
  },
  methods: {
    // _handleKeyDown(e) {
    //   if (e.key === 'Backspace' || e.key === 'Delete') return

    //   console.log(e?.srcElement?.value)
    //   if (e?.srcElement?.value?.length >= 2) {
    //     console.log(typeof e.srcElement.value, e?.srcElement?.value)
    //   }
    //   // e.srcElement.value = e.srcElement.value
    // },
    _handleKeyUp(e, ref) {
      if (!e.srcElement.value) return
      const value = parseInt(e.srcElement.value)

      // const regex = /[0-9]/i
      // if (!regex.test(e.key)) this[ref] = value
      console.log(e.srcElement.value.length)

      switch (ref) {
        case 'hour':
          if (e.srcElement.value.length > 2)
            this.hour = value.toString().slice(-2)

          if (value < 0) this.hour = '00'
          else if (value > 23) this.hour = '23'
          break
        case 'minute':
          if (e.srcElement.value.length > 2)
            this.minute = value.toString().slice(-2)

          if (value < 0) this.minute = '00'
          else if (value > 59) this.minute = '59'
          break
        case 'second':
          if (e.srcElement.value.length > 2)
            this.second = value.toString().slice(-2)

          if (value < 0) this.second = '00'
          else if (value > 59) this.second = '59'
          break
        default:
          break
      }
    },
    decrease(ref) {
      return () => {
        this[ref] -= 1
      }
    },
    increase(ref) {
      //   console.log(ref)
      //   this[ref] += 1
      return () => {
        this[ref] += 1
      }
    },
    increaseHour() {
      this.hour += 1
    }
  }
}
</script>

<template>
  <div class="py-6">
    <div
      class="scroll-container d-flex align-center justify-center mx-auto mb-1"
    >
      <div>
        <v-icon v-longpress="increase('hour')" :disabled="hour >= 23">
          expand_less
        </v-icon>
      </div>

      <div>
        <v-icon v-longpress="increase('minute')">
          expand_less
        </v-icon>
      </div>

      <div>
        <v-icon v-longpress="increase('second')" :disabled="second >= 59">
          expand_less
        </v-icon>
      </div>
    </div>
    <div
      class="d-flex align-center justify-center text-h3 grey mx-auto lighten-2 input-container rounded-lg"
    >
      <input
        ref="hour"
        v-model="hour"
        type="number"
        :placeholder="hourPlaceholder"
        name="hour"
        @keydown.space.prevent
        @keyup="_handleKeyUp($event, 'hour')"
      />

      <span>:</span>

      <input
        ref="minute"
        v-model="minute"
        type="number"
        :placeholder="minutePlaceholder"
        name="minute"
        @keydown.space.prevent
        @keyup="_handleKeyUp($event, 'minute')"
      />

      <span>:</span>

      <input
        ref="second"
        v-model="second"
        type="number"
        :placeholder="secondPlaceholder"
        name="second"
        @keydown.space.prevent
        @keyup="_handleKeyUp($event, 'second')"
      />
    </div>

    <div
      class="scroll-container d-flex align-center justify-center mx-auto mt-1"
    >
      <div>
        <v-icon v-longpress="decrease('hour')" :disabled="hour <= 0">
          expand_more
        </v-icon>
      </div>

      <div>
        <v-icon v-longpress="decrease('minute')" :disabled="minute <= 0">
          expand_more
        </v-icon>
      </div>

      <div>
        <v-icon v-longpress="decrease('second')" :disabled="second <= 0">
          expand_more
        </v-icon>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.input-container {
  width: 282px;
}

.scroll-container {
  div {
    width: calc(282px / 3);

    i {
      margin: auto;
    }
  }
}

input {
  &:focus {
    color: var(--v-primary-base);
    outline: none;
  }

  // caret-color: transparent;
  color: var(--v-utilGrayDark-base);
  cursor: pointer;
  height: 3.5rem;
  padding: 8px auto;
  text-align: center;
  width: 6rem;
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type='number'] {
  -moz-appearance: textfield;
}
</style>
