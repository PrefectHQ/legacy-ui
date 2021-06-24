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
      filter: null,
      where: { is_audit_log: { _eq: true } }
    }
  },
  computed: {
    // where() {
    //   const str = this.filter.toString()
    //   console.log(str)
    //   // const start = new Date()
    //   // const end = new Date()
    //   // start.setHours(0)
    //   // start.setMinutes(0)
    //   // start.setSeconds(0)
    //   // start.setMilliseconds(0)
    //   // end.setHours(23)
    //   // end.setMinutes(59)
    //   // end.setSeconds(59)
    //   // end.setMilliseconds(999)
    //   console.log(this.filter)
    //   return {
    //     ...this.filter,
    //     is_audit_log: { _eq: true }
    //     // timestamp: { _gte: start, _lte: end }
    //   }
    // }
    // where: {
    //   get() {},
    //   set(val) {},
    // }
  },
  watch: {
    filter: {
      handler(val) {
        console.log(val)
        this.where = {
          ...val,
          is_audit_log: { _eq: true }
        }
      },
      deep: true
    }
  },
  methods: {
    handleInput(val) {
      console.log('input')
      this.where = {
        ...val,
        is_audit_log: { _eq: true }
      }
    }
  }
}
</script>

<template>
  <div class="d-flex flex-column system-logs">
    <Toolbar v-model="filter" @input="handleInput" />
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
