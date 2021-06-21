<script>
/* eslint-disable vue/no-v-html */
import { mapGetters } from 'vuex'
import BreadCrumbs from '@/components/BreadCrumbs'
import NavTabBar from '@/components/NavTabBar'
import SubPageNav from '@/layouts/SubPageNav'

export default {
  metaInfo() {
    return {
      titleTemplate: `%s - Admin | ${this.pageTitle}`
    }
  },
  components: {
    BreadCrumbs,
    NavTabBar,
    SubPageNav
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'tenants']),
    ...mapGetters('license', ['planType', 'license']),
    pageTitle() {
      const pageTitles = {
        '/admin/teams/new': 'New team',
        '/admin/account': this.license.account_name || 'Account',
        '/admin/teams': `${
          this.license.account_name ? this.license.account_name + ' ' : ''
        }Teams <span class="font-weight-light text-h6">(${
          this.teams.length
        })</span>`
      }

      return pageTitles[this.$route.path]
    },
    pageType() {
      return this.$route.path == '/admin/teams/new' ? 'New team' : 'Account'
    },
    crumbs() {
      return this.$route.path == '/admin/teams/new'
        ? [
            {
              text: 'Teams',
              route: { path: '/admin/teams' }
            }
          ]
        : []
    },
    tabs() {
      return [
        {
          name: 'Account',
          to: { path: '/admin/account' },
          icon: 'fad fa-abacus'
        },
        {
          name: 'Teams',
          to: { path: '/admin/teams' },
          icon: 'groups',
          disabled: !this.multitenancy,
          badgeText: this.multitenancy ? null : 'Upgrade',
          cardText: this.multitenancy
            ? null
            : 'Multi-team accounts are an enterprise feature; for more information',
          cardLink: 'https://www.prefect.io/pricing#contact',
          cardLinkText: this.multitenancy ? null : 'contact sales'
        }
      ]
    },
    teams() {
      return [...this.tenants?.filter(t => t.license_id == this.license?.id)]
    },
    multitenancy() {
      return this.license?.terms.tenants > 1
    }
  },
  mounted() {
    console.log(this.license)
  }
}
</script>

<template>
  <v-sheet color="appBackground" class="position-relative">
    <SubPageNav icon="groups" :page-type="pageType" hide-banners>
      <span
        slot="breadcrumbs"
        :style="
          $vuetify.breakpoint.smAndDown && {
            display: 'inline',
            'font-size': '0.875rem'
          }
        "
      >
        <BreadCrumbs :crumbs="crumbs" />
      </span>

      <span slot="page-title" v-html="pageTitle" />

      <span slot="tabs" style="width: 100%;">
        <NavTabBar :tabs="tabs" page="Account" paths />
      </span>
    </SubPageNav>

    <div
      class="container-body mx-auto"
      :style="{
        'padding-top': $vuetify.breakpoint.smOnly ? '73px' : '123px'
      }"
    >
      <transition name="quick-fade" mode="out-in">
        <router-view />
      </transition>
    </div>
  </v-sheet>
</template>

<style lang="scss" scoped>
.container-body {
  max-width: 1440px;
}
</style>
