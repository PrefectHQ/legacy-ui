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
    truncate: {
      type: Boolean,
      required: false,
      default: true
    },
    name: {
      type: String,
      required: false,
      default: null
    },
    version: {
      type: Number,
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
    includeVersion() {
      return !this.name ? `(Version ${this.version || this.flow?.version})` : ''
    },
    flowDetails() {
      const name = this.name ? `${this.name}` : `${this.flow?.name}`
      const active = this.active ? '' : '- no current runs'
      return `${name} ${this.includeVersion} ${active}`
    },
    flowNameText() {
      const name = this.name ? `${this.name}` : `${this.flow?.name}`
      return `${name} ${this.includeVersion}`
    },
    textAlign() {
      if (this.left) return 'text-left'
      return 'text-center'
    }
  },
  methods: {
    addDot(state) {
      if (this.active) {
        return {
          'border-radius': '50%',
          display: 'inline-block',
          'background-color': `var(--v-${state}-base)`,
          height: '5px',
          width: '5px',
          'margin-right': '3px'
        }
      } else {
        return {
          'margin-right': '8px'
        }
      }
    },
    onIntersect([entry]) {
      this.$apollo.queries.flow.skip = !entry.isIntersecting
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
      skip() {
        return this.name
      },
      loadingKey: 'loadingKey',
      pollInterval: 500000,
      update: data => data.flow_by_pk
    }
  }
}
</script>

<template>
  <span
    v-if="loadingKey < 1"
    v-intersect="{ handler: onIntersect }"
    class="text-caption max-width"
    :class="[textAlign]"
  >
    <truncate v-if="truncate" :content="flowDetails">
      <span :style="addDot('primary')"></span>
      {{ flowNameText }}
    </truncate>
    <span v-else> {{ flowNameText }} </span>
  </span>
</template>

<style lang="scss" scoped>
div >>> div {
  background-color: var(--v-appBackground-base);
}
</style>
