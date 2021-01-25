<script>
export default {
  data() {
    return {
      previousHeight: 0
    }
  },
  methods: {
    afterEnter(element) {
      element.style.height = 'auto'
    },
    beforeLeave(element) {
      this.previousHeight = getComputedStyle(element).height
    },
    enter(element) {
      const { height } = getComputedStyle(element)
      element.style.height = this.previousHeight

      setTimeout(() => {
        element.style.height = height
      })
    }
  }
}
</script>

<template>
  <v-container class="transition-container">
    <v-card tile class="mx-auto transition-height universal-card" width="500">
      <div ref="universal-card" class="pa-12">
        <div class="arboria text-center">
          <img src="@/assets/logos/cloud-logo.svg" />
        </div>

        <transition
          name="fade"
          mode="out-in"
          @beforeLeave="beforeLeave"
          @enter="enter"
          @afterEnter="afterEnter"
        >
          <router-view />
        </transition>
      </div>
    </v-card>
  </v-container>
</template>

<style lang="scss">
/* stylelint-disable */
input:-webkit-autofill {
  box-shadow: 0 0 0 50px white inset !important;
  -webkit-box-shadow: 0 0 0 50px white inset !important;
  -webkit-text-fill-color: #333 !important;
}

input:-webkit-autofill:focus {
  box-shadow: 0 0 0 50px white inset !important;
  -webkit-box-shadow: 0 0 0 50px white inset !important;
  -webkit-text-fill-color: #333 !important;
}
/* stylelint-enable */

.logo {
  width: 75px;
}

.position-relative {
  position: relative;
}

.universal-card {
  position: relative;
}

.transition-container {
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.transition-height {
  transition: max-height 250ms linear !important;
}

/*
  This is the fade transition css class overrides
*/
.fade-enter-active,
.fade-leave-active {
  overflow: hidden;
  transition: all 250ms ease-in-out;
}

.fade-enter,
.fade-leave-active {
  opacity: 0;
}

@keyframes fade {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>
