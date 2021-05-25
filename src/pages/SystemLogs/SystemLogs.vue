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
      where: {}
    }
  }
}
</script>

<template>
  <div class="d-flex flex-column system-logs">
    <Toolbar v-model="where" />
    <Container :where="where" />
  </div>
</template>

<style lang="scss" scoped>
.system-logs {
  max-height: calc(100vh - 64px);

  @media screen and (max-width: 1264px) {
    max-height: calc(100vh - 104px);
  }
}
</style>
