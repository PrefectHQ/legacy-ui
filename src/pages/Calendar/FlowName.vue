<script>
export default {
  props: {
    id: {
      type: String,
      required: true
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
  <div v-if="loadingKey < 1" class="caption text-center max-width">
    <!-- <router-link :to="{ name: 'flow', params: { id: flow.id } }"> -->
    <truncate v-if="loadingKey < 1" :content="flowName"> </truncate>
    <!-- </router-link> -->
  </div>
</template>
