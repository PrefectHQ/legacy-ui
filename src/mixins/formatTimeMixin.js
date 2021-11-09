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
    dateDiff(date1, date2) {
      const a = moment(date1)
      const b = moment(date2)
      return b.diff(a, 'days')
    },
    datePartHour(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${timeObj ? timeObj.format('h') : moment(timestamp).format('h')}`
    },
    datePartMinute(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj ? timeObj.format('mm') : moment(timestamp).format('mm')
      }`
    },
    datePartMeridian(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${timeObj ? timeObj.format('a') : moment(timestamp).format('a')}`
    },
    dateParts(timestamp) {
      if (!timestamp) {
        return
      }

      const timeObj = moment(timestamp).tz(this.timezone) ?? moment(timestamp)

      return {
        hour: timeObj.format('h'),
        minute: timeObj.format('mm'),
        meridian: timeObj.format('a')
      }
    },
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
    formatCalendarDate(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      const date = `${
        timeObj
          ? timeObj.format('YYYY-MM-DD')
          : moment(timestamp).format('YYYY-MM-DD')
      }`
      return date
    },
    getHour(timestamp) {
      let timeObj = moment(timestamp).tz(this.timezone) || moment(timestamp)
      return timeObj.format('HH')
    },
    formatCalendarTime(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone) || moment(timestamp)
      //Bit of a hack here to make sure that we have timezone but also get the time in milliseconds
      const updated = timeObj.format('YYYY-MM-DD HH:mm:ss')
      return moment(updated).valueOf()
    },
    convertCalendarStartTime(timestamp) {
      const startTime = moment(timestamp).tz(this.timezone) || moment(timestamp)
      const start = startTime.startOf('day').toISOString()
      return start
    },
    addTime(timestamp, amount, unit) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone) || moment(timestamp)
      return timeObj.add(amount, unit).format('YYYY-MM-DD HH:mm:ss')
    },
    addTimeNoTz(timestamp, amount, unit) {
      if (!timestamp) return
      let timeObj = moment(timestamp)
      return timeObj.add(amount, unit).format('YYYY-MM-DD HH:mm:ss')
    },
    getMonth(timestamp) {
      return moment(timestamp).format('MMMM YYYY')
    },
    addDay(timestamp, amount) {
      if (!timestamp) return
      const timeObj = moment(timestamp).tz(this.timezone) || moment(timestamp)
      return timeObj
        .add(amount, 'days')
        .startOf('day')
        .toISOString()
    },
    subtractDay(timestamp, amount) {
      if (!timestamp) return
      const timeObj = moment(timestamp).tz(this.timezone) || moment(timestamp)
      const day = timeObj
        .subtract(amount, 'days')
        .startOf('day')
        .toISOString()
      return day
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
    formTimeNoTimeZone(timestamp) {
      if (!timestamp) return
      return moment(timestamp).format('hh:mma')
    },
    formTime(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj ? timeObj.format('hh:mma') : moment(timestamp).format('hh:mma')
      }`
    },
    tzOffset(date) {
      const zone = moment.tz.zone(this.timezone)
      const offset =
        zone?.parse(Date.UTC(date)) || new Date().getTimezoneOffset()
      return offset
    },
    calEventTime(timestamp, date) {
      if (!timestamp) return
      let t = moment(timestamp).tz(this.timezone)

      let timeObj = t ? t : moment(timestamp)

      let formatted = timeObj.calendar(date, {
        sameDay: 'h:mma',
        nextDay: 'D MMM h:mma',
        nextWeek: 'D MMM',
        lastDay: 'D MMM h: mma',
        lastWeek: 'D MMM ',
        sameElse: 'D MMM '
      })
      return `${formatted}`
    },
    logTime(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj
          ? timeObj.format('HH:mm:ss')
          : moment(timestamp).format('HH:mm:ss')
      }`
    },
    logTimeExtended(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj
          ? timeObj.format('HH:mm:ss:SS')
          : moment(timestamp).format('HH:mm:ss:SS')
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
    formatTimeGranular(timestamp) {
      if (!timestamp) return
      let timeObj = moment(timestamp).tz(this.timezone)
      return `${
        timeObj
          ? timeObj.format('h:mm:ss A')
          : moment(timestamp).format('h:mm:ss A')
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
    },
    formatLongDate(timestamp) {
      if (!timestamp) return

      let t = moment(timestamp).tz(this.timezone)
      let timeObj = t ? t : moment(timestamp)

      let formatted = timeObj.calendar(null, {
        sameDay: '[today]',
        sameElse: 'MMMM D, YYYY'
      })
      return formatted
    },
    formatDateTimeFromUTC(timestamp, timezone) {
      if (!timestamp) return

      let timeObj = moment.tz(timestamp, timezone)

      let formatted = timeObj.calendar(null, {
        sameDay: 'h:mma z',
        sameElse: 'MMMM D, YYYY [at] h:mma z'
      })
      return formatted
    }
  }
}
