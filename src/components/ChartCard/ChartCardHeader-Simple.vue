<script>
export default {
  props: {
    accentColor: {
      type: String,
      default: () => 'rgb(39, 177, 255)'
    },
    chartOverlayMain: { type: String, default: () => null },
    chartOverlayOverline: { type: String, default: () => null },
    chartOverlaySub: { type: String, default: () => null },
    chartOverlayCenter: { type: String, default: () => 'check' }
  },
  computed: {
    chartStyle() {
      return {
        'background-color': this.accentColor,
        color: '#fff'
      }
    }
  }
}
</script>

<template>
  <v-container
    :style="chartStyle"
    class="absolute box chart-box elevation-4 d-flex justify-center"
  >
    <v-container class="absolute overlay">
      <div class="text-overline">
        {{ chartOverlayOverline }}
      </div>
      <div class="text-h2 font-weight-bold">
        {{ chartOverlayMain }}
      </div>
      <div class="font-weight-light text-h5">
        {{ chartOverlaySub }}
      </div>
    </v-container>

    <v-container class="absolute overlay-center">
      <v-icon>{{ chartOverlayCenter }}</v-icon>
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
      left: 50%;
      text-align: center;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 50%;
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
