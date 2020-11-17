<script>
import CalendarDay from '@/pages/Calendar/Calendar-Day'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CalendarDay
  },
  filters: {},
  mixins: [formatTime],
  props: {
    projectId: {
      required: false,
      type: String,
      default: () => null
    }
  },
  data() {
    return {
      timePeriod: 'day',
      timePeriodOptions: ['day', 'week', 'month'],
      timeIntervalOptions: [1, 5, 15, 30, 60],
      timeInterval: 30,
      date: this.formatCalendarDate(new Date())
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    intervalCount() {
      return (60 / this.timeInterval) * 24
    }
  },
  methods: {},
  apollo: {}
}
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="3">
        <v-card>
          <v-date-picker
            v-model="date"
            no-title
            color="primary"
            width="95%"
          ></v-date-picker>
        </v-card>
      </v-col>
      <v-col cols="9">
        <CalendarDay
          v-if="timePeriod === 'day'"
          :project-id="projectId"
          :date="date"
          :time-interval="timeInterval"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
