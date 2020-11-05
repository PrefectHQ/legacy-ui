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
      <h3>{{ state.state }}</h3>
      {{ state }}
    </div>
  </div>
</template>
