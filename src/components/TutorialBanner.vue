<script>
import { mapGetters } from 'vuex'
import ExternalLink from '@/components/ExternalLink'
export default {
  components: { ExternalLink },
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
      <div class="d-inline-flex align-center">
        <v-avatar slot="icon" color="#3b8dff" size="35">
          <v-icon icon="mdi-lock" color="white">
            school
          </v-icon>
        </v-avatar>
        <div class="ml-3">
          Pst! It looks like you don't have any flows yet; check out the
          <router-link :to="{ name: 'tutorial' }"> tutorials</router-link> for
          walkthroughs on writing and registering flows with Prefect and the
          <ExternalLink href="https://docs.prefect.io/"
            >documentation</ExternalLink
          >
          for more in-depth looks at the Prefect APIs
        </div>
        <v-btn
          class="mr-3"
          icon
          text
          dark
          color="#ff5252"
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
