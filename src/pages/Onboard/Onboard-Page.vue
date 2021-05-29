<script>
import '@/styles/slash.scss'

export default {
  data() {
    return {
      start: false
    }
  },
  computed: {
    containerClass() {
      let route = this.$route.name
      return {
        'overflow-y-hidden': this.$vuetify.breakpoint.mdAndUp,
        'bg-blue': route == 'welcome',
        'bg-grey': this.nameTeamOrAcceptRoute
      }
    },
    noSlash() {
      return this.$vuetify.breakpoint.xl
        ? 15
        : this.$vuetify.breakpoint.lg
        ? 10
        : 5
    },
    nameTeamOrAcceptRoute() {
      return (
        this.$route.name == 'name-team' ||
        this.$route.name == 'accept' ||
        this.$route.name == 'plan'
      )
    },
    slashClass() {
      return {
        slash: this.$vuetify.breakpoint.mdAndUp,
        'slash-horizontal': this.$vuetify.breakpoint.smAndDown,
        'slash-full': this.$vuetify.breakpoint.smAndDown,
        'slash-origin-center': this.$vuetify.breakpoint.mdAndUp
      }
    },
    slash1Class() {
      return {
        ...this.slashClass,
        paused: this.$route.name !== 'welcome' || !this.start
      }
    },
    slash2Class() {
      return {
        slash: this.$vuetify.breakpoint.mdAndUp,
        'slash-origin-center': this.$vuetify.breakpoint.mdAndUp,
        paused: !this.start
      }
    },
    slash3Class() {
      return {
        ...this.slashClass,
        paused: !this.nameTeamOrAcceptRoute
      }
    },
    slash4Class() {
      return {
        ...this.slashResourcesClass,
        'slash-origin-left': this.$vuetify.breakpoint.mdAndUp,
        paused: this.$route.name !== 'onboard-resources'
      }
    },
    slash5Class() {
      return {
        ...this.slashResourcesClass,
        'slash-origin-right': this.$vuetify.breakpoint.mdAndUp,
        paused: this.$route.name !== 'onboard-resources'
      }
    },
    slashResourcesClass() {
      return {
        slash: this.$vuetify.breakpoint.mdAndUp,
        'slash-horizontal': this.$vuetify.breakpoint.smAndDown,
        'slash-full': this.$vuetify.breakpoint.smAndDown
      }
    }
  },
  mounted() {
    setTimeout(() => {
      this.start = true
    }, 250)
  },
  methods: {
    slash2Style(i) {
      let width, top
      if (i > this.noSlash / 2) {
        top = i * 5 + 50
        width = Math.floor(Math.random() * (125 - 75)) + 75
      } else {
        top = i * 5
        width = Math.floor(Math.random() * (75 - 25)) + 25
      }

      return {
        top: `${top}%`,
        height: '120px',
        left: 0,
        'transition-delay': `${Math.floor(i / 2) * 25 + 250}ms`,
        width: `${width}%`
      }
    }
  }
}
</script>

<template>
  <v-container
    class="ma-0 pa-0 position-relative test-bg mh-100"
    :class="containerClass"
    fluid
  >
    <transition-group name="fade" mode="out-in">
      <div
        v-if="$vuetify.breakpoint.mdAndUp || $route.name == 'welcome'"
        key="slash-1"
        class="slash-blue o-slash slash-1"
        :class="[slash1Class, $vuetify.breakpoint.mdAndUp ? 'slash-1' : '']"
      >
      </div>
      <div
        v-if="$vuetify.breakpoint.mdAndUp || nameTeamOrAcceptRoute"
        key="slash-3"
        class="slash-grey o-slash slash-3"
        :class="[slash3Class, $vuetify.breakpoint.mdAndUp ? 'slash-3' : '']"
      >
      </div>
      <div
        v-if="$vuetify.breakpoint.mdAndUp"
        key="slash-4"
        class="slash-grey o-slash slash-4"
        :class="slash4Class"
      >
      </div>
      <div
        v-if="$vuetify.breakpoint.mdAndUp"
        key="slash-5"
        class="slash-orange o-slash slash-5"
        :class="slash5Class"
      >
      </div>

      <div
        v-if="$vuetify.breakpoint.mdAndUp && $route.name == 'welcome'"
        key="welcome-slashes"
      >
        <div
          v-for="i in noSlash"
          :key="`welcome-slash-${i}`"
          class="o-slash slash-2"
          :class="[
            slash2Class,
            i % 2 === 0 ? 'slash-blue' : 'slash-light-blue'
          ]"
          :style="slash2Style(i)"
        ></div>
      </div>

      <div
        v-if="$vuetify.breakpoint.mdAndUp && nameTeamOrAcceptRoute"
        key="name-team-slashes"
      >
        <div
          v-for="i in noSlash"
          :key="`name-team-slash-${i}`"
          class="o-slash slash-2"
          :class="[
            slash2Class,
            i % 2 === 0 ? 'slash-grey' : 'slash-grey-reverse'
          ]"
          :style="slash2Style(i)"
        ></div>
      </div>
    </transition-group>

    <transition name="fade" mode="out-in">
      <router-view class="router-view" style="z-index: 3;" />
    </transition>
  </v-container>
</template>

<style lang="scss" scoped>
.mh-100 {
  min-height: 100vh !important;
}

.overflow-y-hidden {
  overflow-y: hidden !important;
}

.bg-blue {
  background-image: linear-gradient(
    105deg,
    #0e50f5,
    var(--v-accentCyan-base)
  ) !important;
}

.bg-grey {
  background-image: linear-gradient(
    105deg,
    var(--v-secondary-base),
    #647489
  ) !important;
}

.o-slash {
  backface-visibility: hidden;
  position: absolute;
  transition: all 250ms;

  &.slash-full {
    height: 100vh !important;
    top: 0 !important;
    transform: none;
    width: 100% !important;

    &.slash-4 {
      left: 0 !important;
      top: 0 !important;
    }

    &.slash-5 {
      left: 0 !important;
      top: 100vh !important;
    }
  }

  &.slash-1 {
    height: 500px;
    top: 50%;
    width: 100%;
  }

  &.slash-2 {
    z-index: 1 !important;
  }

  &.slash-3 {
    height: 600px;
    top: 50%;
    width: 100%;
  }

  &.slash-4 {
    height: 600px;
    left: 0;
    top: 60%;
    width: 49%;
  }

  &.slash-5 {
    height: 600px;
    right: 0;
    top: 40%;
    width: 49%;
  }
}
</style>
