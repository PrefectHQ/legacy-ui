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
    active: {
      type: Boolean,
      required: false,
      default: false
    },
    fgIds: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  data() {
    return {
      loadingKey: 0
    }
  },
  computed: {
    flowDetails() {
      return `${this.flow?.name} 
     ${
       this.fgIds.filter(id => id === this.flow.flow_group_id).length > 1
         ? `(Version ${this.flow.version})`
         : ''
     }`
    },
    textAlign() {
      if (this.left) return null
      return 'text-center'
    },
    textColor() {
      return this.active ? 'primary--text' : null
    }
  },
  watch: {
    flow(val) {
      if (val && this.active) this.$emit('fg', val.flow_group_id)
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
    class="caption max-width"
    :class="[textAlign, textColor]"
  >
    <truncate :content="flowDetails">
      {{ flowDetails }}
    </truncate>
  </span>
</template>

<style lang="scss" scoped>
div >>> div {
  background-color: #f9f9f9;
}
</style>
