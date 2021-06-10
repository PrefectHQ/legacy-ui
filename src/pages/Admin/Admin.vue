<script>
import { mapGetters } from 'vuex'
import BreadCrumbs from '@/components/BreadCrumbs'
import SubPageNav from '@/layouts/SubPageNav'

const pageTitles = {
  'new-team': 'New team',
  account: 'Account'
}

export default {
  metaInfo() {
    return {
      titleTemplate: `%s - Admin | ${this.pageTitle}`
    }
  },
  components: {
    BreadCrumbs,
    SubPageNav
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    pageTitle() {
      return pageTitles[this.$route.name]
    }
  }
}
</script>

<template>
  <v-sheet color="appBackground" class="position-relative">
    <SubPageNav icon="groups" page-type="Admin">
      <span
        slot="breadcrumbs"
        :style="
          $vuetify.breakpoint.smAndDown && {
            display: 'inline',
            'font-size': '0.875rem'
          }
        "
      >
        <BreadCrumbs :crumbs="[]" />
      </span>

      <span slot="page-title">{{ pageTitle }}</span>
    </SubPageNav>

    <div class="container-body mx-auto">
      <router-view />
    </div>
  </v-sheet>
</template>

<style lang="scss" scoped>
.container-body {
  max-width: 1440px;
  padding-top: 73px;
}
</style>
