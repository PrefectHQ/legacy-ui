import moment from '@/utils/moment'
import { mapGetters } from 'vuex'

export const formatTime = {
  data() {
    return {
      dateFilters: [
        { name: '1 Hour', value: 'hour' },
        { name: '24 Hours', value: 'day' },
        { name: '7 Days', value: 'week' },
        { name: '30 Days', value: 'month' }
      ],
      // querying failures for over 24 hours either goes into endless loading or returns a 504 so shortening for now
      shortDateFilters: [
        { name: '1 Hour', value: 'hour' },
        { name: '24 Hours', value: 'day' },
        { name: '7 Days', value: 'week' }
      ],
      selectedDateFilter: 'day'
    }
  },
  computed: {
    ...mapGetters('user', ['user', 'timezone'])
  },
  methods: {
    formatTimeRelative(timestamp) {
      let timeObj = moment(timestamp).tz(this.timezone)
      return timeObj ? timeObj.fromNow() : moment(timestamp).fromNow()
    },
    formatDate(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj
          ? timeObj.format('DD/MM/YY')
          : moment(timestamp).format('DD/MM/YY')
      }`
    },
    shortTime(timestamp) {
      if (!timestamp) return
      let t = moment(timestamp).tz(this.timezone)

      let timeObj = t ? t : moment(timestamp)

      let formatted = timeObj.calendar(null, {
        sameDay: 'h:mma',
        nextDay: 'D MMM ',
        nextWeek: 'D MMM ',
        lastDay: 'D MMM ',
        lastWeek: 'D MMM ',
        sameElse: 'D MMM '
      })
      return `${formatted}`
    },
    formDate(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj
          ? timeObj.format('D MMM YYYY h:mma')
          : moment(timestamp).format('D MMM YYYY h:mma')
      }`
    },
    formTime(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj ? timeObj.format('hh:mma') : moment(timestamp).format('hh:mma')
      }`
    },
    logTime(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj
          ? timeObj.format('HH:mm:ss')
          : moment(timestamp).format('HH:mm:s')
      }`
    },
    logDate(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj
          ? timeObj.format('D MMMM YYYY h:mma')
          : moment(timestamp).format('D MMMM YYYY h:mma')
      }`
    },
    formatTime(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj
          ? timeObj.format('D MMMM YYYY h:mma')
          : moment(timestamp).format('D MMMM YYYY h:mma')
      }`
    },
    formatDateTime(timestamp) {
      if (!timestamp) return

      let t = moment(timestamp).tz(this.timezone),
        shortenedTz = moment()
          .tz(this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
          .zoneAbbr()

      let timeObj = t ? t : moment(timestamp)

      let formatted = timeObj.calendar(null, {
        sameDay: 'h:mma',
        sameElse: 'MMMM D, YYYY [at] h:mma'
      })
      return `${formatted} ${shortenedTz}`
    }
  }
}
