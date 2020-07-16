<script>
import RingChart from '@/components/Visualizations/RingChart'

export default {
  components: {
    RingChart
  },
  props: {
    accentColor: {
      type: String,
      default: () => 'rgb(39, 177, 255)'
    },
    chartOverlayMain: { type: String, default: () => null },
    chartOverlayUnits: { type: String, default: () => null },
    chartOverlayOverline: { type: String, default: () => null },
    chartOverlaySub: { type: String, default: () => null },
    chartOverlayCenter: { type: String, default: () => 'check' },
    chartData: { type: Array, default: () => [] }
  },
  computed: {
    notMobile() {
      if (this.$vuetify.breakpoint.xs) return false
      return true
    },
    chartStyle() {
      return {
        'background-color': this.accentColor,
        color: '#fff'
      }
    },
    overlayStyle() {
      return {
        left: 0,
        width: this.$vuetify.breakpoint.lgAndUp ? '25%' : '20%',
        'text-align': this.$vuetify.breakpoint.mdAndDown ? 'left' : 'right'
      }
    },
    mainClasses() {
      return {
        'display-3': this.$vuetify.breakpoint.lgAndUp,
        'display-1': !this.$vuetify.breakpoint.lgAndUp,
        'justify-end': this.$vuetify.breakpoint.lgAndUp
      }
    }
  }
}
</script>

<template>
  <v-container
    v-if="notMobile"
    :style="chartStyle"
    class="absolute box chart-box elevation-4 d-flex justify-center"
  >
    <v-container class="absolute overlay" :style="overlayStyle">
      <div class="overline">
        {{ chartOverlayOverline }}
      </div>

      <div
        class="display-3 font-weight-bold d-flex align-start"
        :class="mainClasses"
      >
        {{ chartOverlayMain
        }}<span class="title font-weight-black">{{ chartOverlayUnits }}</span>
      </div>
      <div
        class="font-weight-light"
        style="color: rgba(255, 255, 255, 0.8);"
        :class="$vuetify.breakpoint.sm ? 'subtitle-2' : 'headline'"
      >
        {{ chartOverlaySub }}
      </div>
    </v-container>

    <v-container class="absolute overlay-center">
      <v-icon>{{ chartOverlayCenter }}</v-icon>
    </v-container>

    <RingChart :segments="chartData" :width="250" :height="250" />
  </v-container>
  <v-container
    v-else
    :style="chartStyle"
    class="absolute box chart-box elevation-4 d-flex justify-center"
  >
    <v-container
      class="absolute overlay"
      style="
      text-align: 'right';
      width: 50%;"
    >
      <div class="overline">
        {{ chartOverlayOverline }}
      </div>

      <div class="display-2 font-weight-bold d-flex align-start justify-end">
        {{ chartOverlayMain
        }}<span class="title font-weight-black">{{ chartOverlayUnits }}</span>
      </div>
      <div
        class="font-weight-light"
        style="color: rgba(255, 255, 255, 0.8);"
        :class="$vuetify.breakpoint.smAndDown ? 'subtitle-2' : 'headline'"
      >
        {{ chartOverlaySub }}
      </div>
    </v-container>
  </v-container>
</template>

<style lang="scss" scoped>
.absolute {
  position: absolute;
}

.box {
  border-radius: 4px;

  &.chart-box {
    height: 70%;
    left: 50%;
    top: 0;
    transform: translate(-50%);
    width: 87.5%;
    z-index: 2;

    .overlay {
      color: #fff;
      text-align: right;
      top: 50%;
      transform: translate(0, -50%);
    }

    .overlay-center {
      left: 50%;
      text-align: center;
      top: 50%;
      transform: translate(-50%, -50%);
    }

    .v-icon {
      color: rgba(255, 255, 255, 0.4);
      font-size: 6em !important;
    }
  }
}
</style>
