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
    }
  },
  data() {
    return {
      date: new Date(this.value).toISOString().substr(0, 10),
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
      this.timestamp.setMonth(month - 1)
      this.timestamp.setDate(day)

      this.$emit('input', new Date(this.timestamp))
    }
  }
}
</script>

<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    left
    transition="scale-transition"
    origin="top right"
    offset-y
    min-width="460"
    eager
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

      <v-tab-item href="date" transition="quick-fade" eager>
        <v-date-picker
          v-model="date"
          landscape
          class="rounded-0"
          color="primary"
        />
      </v-tab-item>

      <v-tab-item href="time" transition="quick-fade" eager>
        <TimePicker v-model="timestamp" style="min-height: 286px" />
      </v-tab-item>
    </v-tabs>
  </v-menu>
</template>

<style lang="scss">
/* // */
</style>
