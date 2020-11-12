<script>
export default {
  props: {
    id: {
      type: String,
      required: true
    }
  },
  computed: {
    flowName() {
      return this.flow?.name
    }
  },
  apollo: {
    flow: {
      query: require('@/graphql/Flow/flow-by-pk.gql'),
      variables() {
        return {
          flowId: this.id
        }
      },
      loadingKey: 'loadingKey',
      pollInterval: 500000,
      update: data => data?.flow_by_pk
    }
  }
}
</script>

<template>
  <div>
    {{ flowName }}
  </div>
</template>
