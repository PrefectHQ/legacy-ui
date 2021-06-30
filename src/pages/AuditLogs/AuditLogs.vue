<script>
import Container from '@/components/Logs/Container'
import DownloadMenu from '@/components/Logs/DownloadMenu'
import Filters from '@/components/Logs/Filters'
import FilterMenu from '@/components/Logs/FilterMenu'

export default {
  components: {
    Container,
    DownloadMenu,
    Filters,
    FilterMenu
  },
  data() {
    return {
      filter: null
    }
  },
  computed: {
    where() {
      return {
        ...this.filter,
        is_audit_log: { _eq: true }
      }
    }
  }
}
</script>

<template>
  <div class="audit-logs">
    <div class="mt-4">
      <div class="mb-4 text-h4 font-weight-light text-left pl-8">
        Audit Logs
      </div>
    </div>

    <div class="py-1 px-4 d-flex align-center justify-end toolbar">
      <Filters class="mr-auto" :filter="filter" />
      <DownloadMenu :filter="where" />
      <FilterMenu v-model="filter" button-class="ml-2" />
    </div>

    <div class="system-logs">
      <Container :where="where" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.audit-logs {
  .toolbar {
    box-sizing: content-box;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}

.system-logs {
  box-shadow: inset 0px 2px 1px -1px rgb(0 0 0 / 20%),
    0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
  height: calc(100vh - 177px);
  overflow-y: hidden !important;

  @media screen and (max-width: 1264px) {
    height: calc(100vh - 225px);
  }
}
</style>

<style lang="scss">
html {
  overscroll-behavior: none !important;
}
</style>
