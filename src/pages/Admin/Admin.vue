<script>
import { mapGetters } from 'vuex'
import BreadCrumbs from '@/components/BreadCrumbs'
import SubPageNav from '@/layouts/SubPageNav'

const pageTitles = {
  'new-team': 'New team'
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
    <SubPageNav icon="groups" :page-type="pageTitle">
      <span
        slot="breadcrumbs"
        :style="
          $vuetify.breakpoint.smAndDown && {
            display: 'inline',
            'font-size': '0.875rem'
          }
        "
      >
        <BreadCrumbs
          :crumbs="[
            {
              text: 'Dashboard',
              route: { name: 'dashboard', params: { tenant: tenant.slug } }
            }
          ]"
        />
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
  padding-top: 85px;
}
</style>
