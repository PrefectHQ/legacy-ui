<script>
import {
  MS_PER_SECOND,
  MS_PER_MINUTE,
  MS_PER_HOUR,
  durationDifference,
  toDurationDifferenceString,
  getMillisecondsUntilNextSecond,
  getMillisecondsUntilNextMinute,
  getMillisecondsUntilNextHour
} from '@/utils/dateTime'

export default {
  props: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      duration: null,
      interval: null,
      intervalBlocks: {
        second: {
          msInBlock: MS_PER_SECOND,
          msUntilNextBlock: getMillisecondsUntilNextSecond
        },
        minute: {
          msInBlock: MS_PER_MINUTE,
          msUntilNextBlock: getMillisecondsUntilNextMinute
        },
        hour: {
          msInBlock: MS_PER_HOUR,
          msUntilNextBlock: getMillisecondsUntilNextHour
        }
      }
    }
  },
  computed: {
    durationDifferenceString() {
      return toDurationDifferenceString(this.duration ?? {})
    },
    smallestBlock() {
      const blocks = Object.keys(this.duration ?? {})
        .map(key => this.intervalBlocks[key])
        .sort((a, b) => a.msInBlock - b.msInBlock)

      return blocks.length ? blocks[0] : null
    }
  },
  watch: {
    endTime() {
      this.startIntervalAtNextBlock()
    }
  },
  mounted() {
    this.startIntervalAtNextBlock()
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    updateDuration() {
      this.duration = durationDifference(
        new Date(this.startTime),
        this.endTime ? new Date(this.endTime) : new Date()
      )
    },
    startIntervalAtNextBlock() {
      clearInterval(this.interval)
      this.updateDuration()

      if (this.endTime) {
        return
      }

      this.interval = setTimeout(
        this.startInterval,
        this.smallestBlock.msUntilNextBlock()
      )
    },
    startInterval() {
      this.updateDuration()

      this.interval = setInterval(
        this.updateDuration,
        this.smallestBlock.msInBlock
      )
    }
  }
}
</script>

<template>
  <span class="duration-span">
    {{ durationDifferenceString }}
  </span>
</template>
