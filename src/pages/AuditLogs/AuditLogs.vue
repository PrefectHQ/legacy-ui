<script>
import Container from '@/components/Logs/Container'
import DownloadMenu from '@/components/Logs/DownloadMenu'
import Filters from '@/components/Logs/Filters'
import FilterMenu from '@/components/Logs/FilterMenu'
import SubPageNav from '@/layouts/SubPageNav'
import { mapGetters } from 'vuex'

export default {
  components: {
    Container,
    DownloadMenu,
    Filters,
    FilterMenu,
    SubPageNav
  },
  data() {
    return {
      filter: null
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    where() {
      return {
        ...this.filter,
        is_audit_log: { _eq: true },
        tenant_id: { _eq: this.tenant.id }
      }
    }
  }
}
</script>

<template>
  <div class="audit-logs">
    <SubPageNav icon="notes" page-type="Logs" hide-banners full-width>
      <span slot="page-title">Audit Logs</span>
    </SubPageNav>

    <div class="spacer" />

    <div class="py-1 px-4 d-flex align-center justify-end toolbar">
      <Filters
        class="mr-auto"
        :filter="filter"
        @filter-click="$refs['filter-menu'].openMenu()"
      />
      <FilterMenu ref="filter-menu" v-model="filter" button-class="mr-2" />
      <DownloadMenu :filter="where" />
    </div>

    <div class="system-logs">
      <Container :where="where" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.audit-logs {
  .spacer {
    padding-top: 84px;
  }

  .toolbar {
    box-sizing: content-box;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}

.system-logs {
  box-shadow: inset 0px 2px 1px -1px rgb(0 0 0 / 20%),
    0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
  height: calc(100vh - 185px);
  overflow-y: hidden !important;

  @media screen and (max-width: 1264px) {
    height: calc(100vh - 233px);
  }
}
</style>

<style lang="scss">
html {
  overscroll-behavior: none !important;
}
</style>
