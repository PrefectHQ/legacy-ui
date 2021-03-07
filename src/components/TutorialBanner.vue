<script>
import { mapGetters } from 'vuex'
export default {
  props: {
    pageScroll: {
      type: Boolean,
      required: false,
      default: () => false
    }
  },
  data() {
    return {
      dismissed: false
    }
  },
  computed: {
    ...mapGetters('data', ['flows']),
    ...mapGetters('api', ['isCloud']),
    showBanner() {
      let show = this.flows?.length === 0
      if (!this.dismissed && this.pageScroll) {
        show = !this.pageScroll
      } else if (this.dismissed || this.$vuetify.breakpoint.smAndDown) {
        show = false
      }
      return show
    }
  }
}
</script>

<template>
  <v-banner :value="showBanner">
    <template #default>
      <div class="d-flex align-center">
        <v-avatar slot="icon" color="primary" size="40">
          <v-icon icon="mdi-lock" color="white">
            school
          </v-icon>
        </v-avatar>
        <div class="ml-4">
          Getting started? Check out
          <a href="https://docs.prefect.io/orchestration/tutorial/overview.html"
            >this tutorial</a
          >
          on deploying and running your first flow!
        </div>
        <v-btn
          class="ml-auto"
          width="40"
          height="40"
          icon
          text
          dark
          color="error"
          @click="dismissed = !dismissed"
        >
          <v-icon>
            close
          </v-icon>
        </v-btn>
      </div>
    </template>
  </v-banner>
</template>
