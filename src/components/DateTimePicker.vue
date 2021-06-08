<script>
import TimePicker from '@/components/TimePicker'

export default {
  components: {
    TimePicker
  },
  props: {
    icon: {
      type: String,
      required: false,
      default: 'calendar_today'
    },
    label: {
      type: String,
      required: false,
      default: 'Date'
    },
    value: {
      type: Date,
      required: true
      // default: () => new Date()
    }
  },
  data() {
    return {
      date: null,
      menu: false,
      tab: 'date',
      timestamp: new Date(this.value)
    }
  },
  watch: {
    date(val) {
      if (!val) return
      const [year, month, day] = this.date.split('-')
      this.timestamp.setYear(year)
      this.timestamp.setMonth(month)
      this.timestamp.setDate(day)

      this.$emit('update', this.timestamp)
    }
  },
  mounted() {
    const year = this.value.getFullYear()
    const month = this.value.getMonth()
    const day = this.value.getDate()

    this.date = `${year}-${month > 9 ? month : '0' + month}-${
      day > 9 ? day : '0' + day
    }`
  }
}
</script>

<template>
  <div class="px-4 py-2 d-flex">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      left
      transition="scale-transition"
      origin="top right"
      offset-y
      min-width="460"
    >
      <template #activator="{ on, attrs }">
        <v-text-field
          v-model="timestamp"
          :prepend-inner-icon="icon"
          outlined
          readonly
          :label="label"
          hide-details
          dense
          v-bind="attrs"
          v-on="on"
        />
      </template>

      <v-tabs v-model="tab" background-color="primary" dark centered>
        <v-tab key="date" class="ml-auto">Date</v-tab>
        <v-tab key="time">
          Time
        </v-tab>

        <v-tab-item href="date" transition="quick-fade">
          <v-date-picker
            v-model="date"
            landscape
            class="rounded-0"
            color="primary"
          />
        </v-tab-item>

        <v-tab-item href="time" transition="quick-fade">
          <TimePicker v-model="timestamp" style="min-height: 286px" />
        </v-tab-item>
      </v-tabs>
    </v-menu>
  </div>
</template>

<style lang="scss">
// /* Chrome, Safari, Edge, Opera */
// input::-webkit-outer-spin-button,
// input::-webkit-inner-spin-button {
//   -webkit-appearance: none;
//   margin: 0;
// }

// /* Firefox */
// input[type='number'] {
//   -moz-appearance: textfield;
// }
</style>
