<template>
  <div class="argument-heading">
    <div class="argument-heading__title">
      {{ title }}
      <span v-if="argument.length" class="argument-heading__tag">
        {{ argument }}
      </span>
    </div>

    <div class="argument-heading__description">
      <slot />
    </div>
  </div>
</template>

<script lang="js">
export default {
  props: {
    argument: {
      type: String,
      required: false,
      default: ''
    },
    title: {
      type: String,
      required: true
    }
  }
}
</script>

<style lang="scss">
.argument-heading__tag {
  background-color: #fafafa !important;
  border: 1px solid var(--v-utilGrayLight-base);
  border-radius: 2px;
  color: #455a64 !important;
  caret-color: #455a64 !important;
  padding: 0 4px;
  font-size: 0.75rem !important;
  font-weight: 400;
  line-height: 1.25rem;
  letter-spacing: 0.0333333333em !important;
}

.argument-heading__title {
  font-size: 1.25rem !important;
  font-weight: 500;
  line-height: 2rem;
  letter-spacing: 0.0125em !important;
}

.argument-heading__description {
  font-size: 0.875rem !important;
  font-weight: 400;
  line-height: 1.25rem;
  letter-spacing: 0.0178571429em !important;
}
</style>
