<script>
import Container from '@/components/Logs/Container'
import FilterMenu from '@/components/Logs/FilterMenu'

export default {
  components: {
    Container,
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
  <div v-if="true" class="system-logs">
    <div
      class="white elevation-1 py-1 px-4 d-flex align-middle justify-end position-sticky"
    >
      <FilterMenu v-model="filter" />
    </div>

    <Container :where="where" />
  </div>
  <div v-else class="system-logs">hello</div>
</template>

<style lang="scss" scoped>
.system-logs {
  height: calc(100vh - 64px);
  overflow-y: hidden !important;

  @media screen and (max-width: 1264px) {
    height: calc(100vh - 112px);
  }
}
</style>

<style lang="scss">
html {
  overscroll-behavior: none !important;
}
</style>
