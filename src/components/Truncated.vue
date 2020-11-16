<script>
export default {
  props: {
    content: {
      type: String,
      required: true
    }
  }
}
</script>

<template>
  <v-tooltip top>
    <template #activator="{ on }">
      <span
        class="truncate"
        style="
          display: inline-block;
          width: 100%;
        "
        v-on="on"
      >
        <slot>
          {{ content }}
        </slot>
      </span>
    </template>
    <span>{{ content }}</span>
  </v-tooltip>
</template>
