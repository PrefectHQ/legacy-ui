<script>
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  mixins: [formatTime],
  props: {
    states: { type: Array, required: true }
  },
  methods: {}
}
</script>

<template>
  <div class="v-tooltip__content">
    <div v-for="(state, i) in states" :key="i">
      <div class="title">{{ state.state }}</div>
      {{ state }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.divider {
  border: 1px solid #fff;
  margin: 8px 0;
}
</style>
