<script>
export default {
  data() {
    return {
      welcome: false
    }
  },
  mounted() {
    setTimeout(() => {
      this.welcome = true
    }, 750)

    setTimeout(() => {
      this.$router.push({
        name: 'plan'
      })
    }, 3500)
  }
}
</script>

<template>
  <v-container class="text-center fill-height pa-0" fluid>
    <v-slide-x-transition>
      <div v-if="welcome" class="grey--text text--lighten-5 welcome-text">
        <div class="display-1">
          welcome to
        </div>
        <div class="logo">
          <img
            class="ma-auto white--fill"
            src="@/assets/logos/cloud-logo-white.svg"
          />
        </div>
      </div>
    </v-slide-x-transition>
  </v-container>
</template>

<style lang="scss" scoped>
.fill-height {
  height: 100vh !important;
}

.welcome-text {
  left: 50%;
  max-width: 700px;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  z-index: 1;
}

.logo {
  img {
    height: auto;
    max-width: 700px;
    width: 90%;
  }
}
</style>
