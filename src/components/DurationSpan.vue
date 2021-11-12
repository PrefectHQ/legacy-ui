<script>
import { durationDifference } from '@/utils/dateTime'
import { toPlural } from '@/utils/string'
import {
  MS_PER_SECOND,
  MS_PER_MINUTE,
  MS_PER_HOUR,
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
    blocks() {
      return Object.entries(this.duration ?? {})
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
    },
    toPlural
  }
}
</script>

<template>
  <span class="duration-span">
    <span
      v-for="[key, value] in blocks"
      :key="key"
      class="duration-span__block"
    >
      {{ value }} {{ toPlural(key, value) }}
    </span>
  </span>
</template>

<style lang="scss" scoped>
.duration-span__block:first-child {
  margin-right: 2px;
  content: ',';
}
</style>
