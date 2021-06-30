<script>
import Container from '@/components/Logs/Container'
import DownloadMenu from '@/components/Logs/DownloadMenu'
import FilterMenu from '@/components/Logs/FilterMenu'

export default {
  components: {
    Container,
    DownloadMenu,
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
  <div>
    <div class="mt-4">
      <div class="mb-4 text-h4 font-weight-light text-center">
        Audit Logs
      </div>
      <div class="py-1 px-4 d-flex align-center justify-center position-sticky">
        <DownloadMenu :filter="where" />
        <FilterMenu v-model="filter" button-class="ml-2" />
      </div>
    </div>

    <div class="system-logs">
      <Container :where="where" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.system-logs {
  box-shadow: inset 0px 2px 1px -1px rgb(0 0 0 / 20%),
    0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
  height: calc(100vh - 176px);
  overflow-y: hidden !important;

  @media screen and (max-width: 1264px) {
    height: calc(100vh - 224px);
  }
}
</style>

<style lang="scss">
html {
  overscroll-behavior: none !important;
}
</style>
