import { STATE_NAMES } from '@/utils/states.js'

export const heartbeatMixin = {
  data() {
    return { state: 'All', stateNames: STATE_NAMES, stateList: [] }
  },
  computed: {
    checkedState() {
      if (this.state === 'All') return null
      if (!this.state) return null
      return this.state
    },
    states() {
      return this.stateNames.filter(name => name !== 'Scheduled')
    }
  },
  methods: {}
}
