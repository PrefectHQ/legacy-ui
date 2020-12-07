<script>
export default {
  props: {
    depth: {
      type: Number,
      required: false,
      default: () => 0
    },
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: false,
      default: null
    },
    nodes: {
      type: Array,
      required: false,
      default: () => []
    }
  }
}
</script>

<template>
  <div>
    <div>
      {{ label }}
    </div>
    <ArtifactNodeTree
      v-for="node in nodes"
      :id="node.id"
      :key="node.id"
      :depth="depth + 1"
      :label="node.label"
      :nodes="nodes.nodes"
    />
  </div>
</template>
