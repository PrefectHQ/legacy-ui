<script>
import { duration } from '@/utils/moment'
import DurationSpan from '@/components/DurationSpan'
import StackedLineChart from '@/components/Visualizations/StackedLineChart'
import { STATE_COLORS } from '@/utils/states'
import { FINISHED_STATES } from '@/utils/states'

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
    multiplier: { type: Number, required: true },
    nodeData: { type: null, required: true },
    showDetails: { type: Boolean, required: false, default: () => true },
    size: { type: null, required: true },
    transform: { type: null, required: true }
  },
  data() {
    return {
      scale: false
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
        color: this.disabled ? 'var(--v-utilGrayLight-base)' : '',
        'font-size': `${size}px !important`,
        'line-height': `${size}px !important`
      }
    },
    isParameter() {
      return this.nodeData?.data?.type?.split('.').pop() == 'Parameter'
    },
    isResource() {
      return (
        this.nodeData?.data?.type?.split('.').pop() == 'ResourceCleanupTask' ||
        this.nodeData?.data?.type?.split('.').pop() == 'ResourceSetupTask'
      )
    },
    segments() {
      if (!this.mappedChildren) return []
      return Object.keys(this.mappedChildren.state_counts).map(state => {
        return {
          label: state,
          value: this.mappedChildren.state_counts[state]
        }
      })
    },
    subtitleStyle() {
      let size = 64 * (1 / this.transform.k)
      size = size < 64 ? 64 : size > 84 ? 84 : size
      return {
        color: this.disabled
          ? 'var(--v-navIcons-base)'
          : 'var(--v-utilGrayDark-base)',
        'font-size': `${size}px !important`,
        'line-height': `${size}px !important`
      }
    },
    titleStyle() {
      let size = 84 * (1 / this.transform.k)
      size = size < 84 ? 84 : size > 96 ? 96 : size
      return {
        color: this.disabled
          ? 'var(--v-navIcons-base)'
          : 'var(--v-utilGrayDark-base)',
        'font-size': `${size}px !important`,
        'line-height': `${size + 10}px !important`
      }
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
    },
    isFinished(state) {
      return FINISHED_STATES.includes(state)
    }
  },
  apollo: {
    mappedChildren: {
      query: require('@/graphql/MappedTasks/mapped-children.gql'),
      variables() {
        return {
          taskRunId: this.nodeData?.data?.task_run_id
        }
      },
      skip() {
        return (
          this.nodeData?.data?.state !== 'Mapped' ||
          !this.nodeData?.data?.task_run_id
        )
      },
      pollInterval: 3000,
      update: data => data.mapped_children
    }
  }
}
</script>

<template>
  <div
    v-ripple
    class="utilGrayLight d-flex align-center node ripple"
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
      <div
        v-if="nodeData.data.task"
        class="text-subtitle-2 text-truncate font-weight-light"
        :style="subtitleStyle"
      >
        <v-avatar
          v-if="isResource || isParameter"
          color="accentOrange"
          size="0.75em"
        >
          <span v-if="isParameter" class="text-h2 white--text font-weight-black"
            >P</span
          >
          <span v-if="isResource" class="text-h2 white--text font-weight-black"
            >R</span
          >
        </v-avatar>
        {{ nodeData.data.task.name }}
      </div>
      <div
        class="text-h6 text-truncate font-weight-bold mt-4"
        :style="titleStyle"
      >
        <v-avatar
          v-if="isResource || isParameter"
          color="accentOrange"
          size="0.75em"
        >
          <span v-if="isParameter" class="text-h2 white--text font-weight-black"
            >P</span
          >
          <span v-if="isResource" class="text-h2 white--text font-weight-black"
            >R</span
          >
        </v-avatar>
        {{ nodeData.data.name }}
      </div>
      <div
        v-if="showDetails && nodeData.data.start_time"
        :style="durationStyle"
      >
        Duration:
        <DurationSpan
          :start-time="nodeData.data.start_time"
          :end-time="
            nodeData.data.end_time
              ? nodeData.data.end_time
              : isFinished(nodeData.data.state)
              ? nodeData.data.start_time
              : null
          "
        />
      </div>
    </div>
    <div
      v-if="mappedChildren && showDetails"
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
