<script>
export default {
  props: {
    id: {
      type: String,
      required: true
    },
    left: {
      type: Boolean
    },
    icon: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      loadingKey: 0
    }
  },
  computed: {
    flowDetails() {
      return `${this.flow.name} `
      // (Version ${this.flow.version})`
    },
    textAlign() {
      if (this.left) return null
      return 'text-center'
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
  <span
    v-if="loadingKey < 1"
    class="caption max-width grey-back"
    :class="textAlign"
  >
    <truncate :content="flowDetails">
      <v-icon v-if="icon === 'active'" color="codePink" small
        >pi-flow-run</v-icon
      >
      <v-icon v-if="icon === 'selected'" color="green" small
        >pi-flow-run</v-icon
      >
      <!-- <router-link :to="{ name: 'flow', params: { id: flow.id } }"> -->
      {{ flowDetails }}
      <!-- </router-link> -->
    </truncate>
  </span>
</template>

<style lang="scss" scoped>
div >>> div {
  background-color: #f9f9f9 !important;
}
</style>
