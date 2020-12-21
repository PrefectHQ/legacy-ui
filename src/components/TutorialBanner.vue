<script>
import gql from 'graphql-tag'

export default {
  props: {
    pageScroll: {
      type: Boolean,
      required: false,
      default: () => false
    },
    tenantSlug: {
      type: String,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      dismissed: false
    }
  },
  computed: {
    showBanner() {
      // let show = this.flowCount ? this.flowCount === 0 : false
      let show = this.flowCount > 0
      if (!this.dismissed && this.pageScroll) {
        show = !this.pageScroll
      } else if (this.dismissed) {
        show = false
      }
      return show
    }
  },
  apollo: {
    flowCount: {
      query: gql`
        query {
          flow_group_aggregate {
            aggregate {
              count
            }
          }
        }
      `,
      update: data => data.flow_group_aggregate.aggregate.count
    }
  }
}
</script>

<template>
  <div>
    {{ flowCount }}
    <v-banner :value="showBanner" two-line>
      <v-avatar slot="icon" color="#3b8dff" size="40">
        <v-icon icon="mdi-lock" color="white">
          school
        </v-icon>
      </v-avatar>

      Looks like you don't have any flows. Check out our tutorials to learn
      more!

      <template #actions>
        <v-btn
          text
          color="#3b8dff"
          :to="{ name: 'tutorial', params: { tenant: tenantSlug } }"
        >
          Yes
        </v-btn>
        <v-btn text color="#ff5252" @click="dismissed = !dismissed">
          Dismiss
        </v-btn>
      </template>
    </v-banner>
  </div>
</template>
