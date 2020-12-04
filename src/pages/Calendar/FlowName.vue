<script>
export default {
  props: {
    id: {
      type: String,
      required: true
    },
    left: {
      type: Boolean
    }
  },
  data() {
    return {
      loadingKey: 0
    }
  },
  computed: {
    flowName() {
      return this.flow?.name
    },
    textAlign() {
      if (this.left) return null
      return 'text-center'
    }
  },
  apollo: {
    flow: {
      query: require('@/graphql/Calendar/calendar-flows.gql'),
      variables() {
        return {
          flowId: this.id
        }
      },
      loadingKey: 'loadingKey',
      pollInterval: 500000,
      update: data => data?.flow_group_by_pk?.flows[0]
    }
  }
}
</script>

<template>
  <div
    v-if="loadingKey < 1"
    class="caption max-width grey-back"
    :class="textAlign"
  >
    <!-- <router-link :to="{ name: 'flow', params: { id: flow.id } }"> -->
    <truncate v-if="loadingKey < 1" :content="flowName"> </truncate>
    <!-- </router-link> -->
  </div>
</template>

<style lang="scss" scoped>
div >>> div {
  background-color: #f9f9f9 !important;
}
</style>
