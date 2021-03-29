<script>
export default {
  props: {
    states: { type: Array, required: true }
  }
}
</script>

<template functional>
  <div class="v-tooltip__content tooltip">
    <div v-for="(state, i) in props.states" :key="i">
      <div class="text-body-1 ">
        <span class="font-weight-medium" :style="{ color: state.color }">
          {{ state.label }}
        </span>
        at
        {{ state.formattedTime }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tooltip {
  height: auto;
  width: 100%;
}
</style>
