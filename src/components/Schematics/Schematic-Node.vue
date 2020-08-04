<script>
import { duration } from '@/utils/moment'
import DurationSpan from '@/components/DurationSpan'
import StackedLineChart from '@/components/Visualizations/StackedLineChart'
import { STATE_COLORS } from '@/utils/states'

const defaultSegments = () => [
  { label: 'Pending', value: 0 },
  { label: 'Running', value: 0 },
  { label: 'Success', value: 0 },
  { label: 'Failed', value: 0 }
]

export default {
  filters: {
    duration: function(v) {
      if (!v) return ''

      const runTime = duration(v)

      if (runTime >= duration(1, 'week')) {
        return runTime.format('w[w], d[d], h[h]')
      } else if (runTime >= duration(1, 'day')) {
        return runTime.format('d d], h[h], m[m]')
      } else if (runTime >= duration(1, 'hour')) {
        return runTime.format('h[h], m[m], s[s]')
      } else if (runTime >= duration(1, 'minute')) {
        return runTime.format('m[m], s[s]')
      } else if (runTime >= duration(1, 's')) {
        return runTime.format('s[s]')
      } else if (runTime < duration(1, 'second')) {
        return '<1s'
      }
      return runTime.humanize()
    }
  },
  components: { StackedLineChart, DurationSpan },
  props: {
    // /** @typedef {import('d3').Node} Node */
    // This doesn't pass webpack compilation so disabling for now...
    // we can reinstate with TS
    disabled: { type: Boolean, required: false, default: () => false },
    mapped: {
      type: Array,
      required: false,
      default: () => null
    },
    multiplier: { type: Number, required: true },
    nodeData: { type: null, required: true },
    showDetails: { type: Boolean, required: false, default: () => true },
    size: { type: null, required: true },
    transform: { type: null, required: true }
  },
  data() {
    return {
      scale: false,
      segments: defaultSegments()
    }
  },
  computed: {
    appliedTransform() {
      return this.transform.apply([this.nodeData.x, this.nodeData.y])
    },
    colors() {
      return STATE_COLORS
    },
    cardStyle() {
      let transform = `translate(${this.appliedTransform[0]}px, ${
        this.appliedTransform[1]
      }px) scale(${this.transform.k / this.size})`

      return {
        'border-color': 'none !important',
        'border-left': this.nodeData.data.state
          ? `6rem solid ${
              this.disabled
                ? this.hex2RGBA(STATE_COLORS[this.nodeData.data.state])
                : STATE_COLORS[this.nodeData.data.state]
            } !important`
          : '',
        transform: transform
      }
    },
    durationStyle() {
      let size = 48 * (1 / this.transform.k)
      size = size < 48 ? 48 : size > 64 ? 64 : size
      return {
        color: this.disabled ? '#bbb' : '',
        'font-size': `${size}px !important`,
        'line-height': `${size}px !important`
      }
    },
    isParameter() {
      return this.nodeData.data.type.split('.').pop() == 'Parameter'
    },
    subtitleStyle() {
      let size = 64 * (1 / this.transform.k)
      size = size < 64 ? 64 : size > 84 ? 84 : size
      return {
        'background-color': 'var(--v-accentOrange-base)',
        color: '#fff !important',
        'font-size': `${size}px !important`,
        'line-height': `${size}px !important`
      }
    },
    titleStyle() {
      let size = 84 * (1 / this.transform.k)
      size = size < 84 ? 84 : size > 96 ? 96 : size
      return {
        color: this.disabled ? '#bbb' : '',
        'font-size': `${size}px !important`,
        'line-height': `${size + 10}px !important`
      }
    }
  },
  watch: {
    mapped(val) {
      let segments = defaultSegments()
      val.forEach(task => {
        let index = segments.findIndex(s => s.label == task.state)

        if (index > -1) {
          segments[index].value++
        } else {
          segments.push({
            label: task.state,
            value: 1
          })
        }
      })
      this.segments = segments
    }
  },
  mounted() {
    if (this.mapped) {
      let segments = defaultSegments()
      this.mapped.forEach(task => {
        let index = segments.findIndex(s => s.label == task.state)

        if (index > -1) {
          segments[index].value++
        } else {
          segments.push({
            label: task.state,
            value: 1
          })
        }
      })
      this.segments = segments
    }
  },
  methods: {
    _mouseOut() {
      this.scale = false
      this.$emit('mouseout', null)
    },
    _mouseOver() {
      this.scale = true
      this.$emit('mouseover', this.nodeData)
    },
    wheelEvent(e) {
      if (!e) return
      e.preventDefault()

      // We can emit this later if we want to figure out
      // how best to implement zooming from the node
      // this.$emit('wheel-event', {
      //   e: e
      // })
    },
    nodeClick() {
      this.$emit('node-click', this.nodeData.data)
    },
    hex2RGBA(hex) {
      // Doesn't support 3 char hex values
      let red = hex.substr(1, 2),
        green = hex.substr(3, 2),
        blue = hex.substr(5, 4)
      let red10 = parseInt(red, 16),
        green10 = parseInt(green, 16),
        blue10 = parseInt(blue, 16)
      return `rgba(${red10}, ${green10}, ${blue10}, 0.6)`
    }
  }
}
</script>

<template>
  <div
    v-ripple
    class="grey lighten-3 d-flex align-center node ripple"
    :class="showDetails ? 'elevation-3' : ''"
    :style="cardStyle"
    tile
    style="cursor: pointer;"
    @click="nodeClick"
    @mouseover="_mouseOver"
    @mouseout="_mouseOut"
    @mousewheel="wheelEvent"
  >
    <div class="ml-12 node-content" style="width: calc(100% - 6rem);">
      <div class="title truncate font-weight-bold" :style="titleStyle">
        <v-icon v-if="isParameter" class="parameter-icon ma-auto">
          local_parking
        </v-icon>
        {{ nodeData.data.name }}
      </div>
      <div
        v-if="
          showDetails && (nodeData.data.duration || nodeData.data.start_time)
        "
        :style="durationStyle"
      >
        Duration:
        <span v-if="nodeData.data.duration" class="font-weight-black">
          {{ nodeData.data.duration | duration }}
        </span>
        <DurationSpan
          v-else-if="nodeData.data.start_time"
          :start-time="nodeData.data.start_time"
        />
      </div>
    </div>
    <div
      v-if="mapped && showDetails"
      class="line-chart"
      :class="disabled ? 'disabled' : ''"
    >
      <StackedLineChart :segments="segments" :colors="colors" :height="50" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.node {
  height: 300px;
  left: -425px;
  pointer-events: auto;
  position: absolute;
  top: -150px;
  width: 850px;

  .node-content {
    pointer-events: none;
    user-select: none;
  }
}

.h-100 {
  height: 100%;
}

.parameter-icon {
  background-color: var(--v-accentOrange-base);
  border-radius: 50%;
  color: #fff !important;
  font-size: 0.75em !important;
  padding: 0.1em;
}

.position-relative {
  position: relative !important;
}

.line-chart {
  bottom: 0;
  height: 50px;
  left: 0;
  position: absolute !important;
  width: calc(850px - 6rem);

  &.disabled {
    opacity: 0.6;
  }
}
</style>
