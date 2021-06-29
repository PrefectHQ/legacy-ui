<script>
import Container from '@/components/Logs/Container'
import Toolbar from '@/components/Logs/Toolbar'

export default {
  components: {
    Container,
    Toolbar
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
    <Toolbar v-model="filter" />
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
