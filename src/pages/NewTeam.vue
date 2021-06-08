<script>
import { mapGetters } from 'vuex'
import BreadCrumbs from '@/components/BreadCrumbs'
import SubPageNav from '@/layouts/SubPageNav'

export default {
  metaInfo() {
    return {
      titleTemplate: '%s - New team'
    }
  },
  components: {
    BreadCrumbs,
    SubPageNav
  },
  computed: {
    ...mapGetters('tenant', ['tenant'])
  }
}
</script>

<template>
  <v-sheet color="appBackground" class="position-relative">
    <SubPageNav icon="groups" page-type="New team">
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

      <span slot="page-title">New team</span>
    </SubPageNav>
  </v-sheet>
</template>

<style lang="scss" scoped>
/* */
</style>
