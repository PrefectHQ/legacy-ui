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
    ...mapGetters('api', ['isCloud'])
  },
  methods: {
    handleDismiss() {
      this.dismissed = true
      localStorage.setItem('dismissedSupportBanner', true)
    }
  }
}
</script>

<template>
  <v-banner :value="!dismissed">
    <template #default>
      <div class="d-flex align-center">
        <v-avatar slot="icon" rounded color="primary" size="40">
          <i class="o-100 fad fa-life-ring fa-2x" />
        </v-avatar>
        <div class="ml-4">
          Prefect now offers Standard support for self-serve users on Prefect
          Cloud 2. To purchase, reach out to help@prefect.io or
          <ExternalLink
            href="https://calendly.com/prefect-experts/prefect-product-advocates-support?utm_source=cloud1">
            set up time
          </ExternalLink>
          with our team.
        </div>
        <v-btn
          class="ml-auto"
          width="40"
          height="40"
          icon
          text
          dark
          @click="handleDismiss"
        >
          <v-icon>close</v-icon>
        </v-btn>
      </div>
    </template>
  </v-banner>
</template>

<style lang="scss" scoped>
$dark-grey-icon: var(--v-utilGrayMid-base);
$dark-blue-icon: var(--v-primaryDark-base);

.o-100 {
  &.svg-inline--fa {
    --fa-primary-opacity: 0.8;
    --fa-secondary-opacity: 0.8;
  }
}

.fa-life-ring {
  --fa-secondary-color: #fff;
  --fa-primary-color: #{$dark-blue-icon};
}
</style>
