<script>
import { VTooltip } from 'vuetify/lib'

export default {
  components: {
    VTooltip
  },
  props: {
    content: {
      type: String,
      required: false,
      default: null
    }
  }
}
</script>

<template functional>
  <component :is="$options.components.VTooltip" top>
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
          {{ props.content }}
        </slot>
      </span>
    </template>
    <span>{{ props.content }}</span>
  </component>
</template>
