<template>
  <div
    class="pl-md-8 mb-6 mb-md-0 pl-sm-0 py-0"
    :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }"
  >
    <div class="text-h6">
      {{ title }}
      <span
        v-if="argument.length"
        class="text-caption grey lighten-5 blue-grey--text text--darken-2 rounded-sm ml-1 px-1"
        style="border: 1px solid utilGrayLight !important;"
      >
        {{ argument }}
      </span>
    </div>

    <div class="mt-2 text-body-2">
      <slot>
        {{ description }}
      </slot>
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
    },
    description: {
      type: String,
      required: true
    }
  }
}
</script>
