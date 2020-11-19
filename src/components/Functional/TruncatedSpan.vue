<script>
import { VTooltip } from 'vuetify/lib'

export default {
  components: {
    VTooltip
  },
  props: {
    content: {
      type: [Number, String],
      required: false,
      default: null
    }
  }
}
</script>

<template functional>
  <component :is="$options.components.VTooltip" top>
    <template #activator="{ on }">
      <div
        class="truncate"
        style="
          width: auto;
        "
        v-on="on"
      >
        <slot>
          {{ props.content }}
        </slot>
      </div>
    </template>
    <span>{{ props.content }}</span>
  </component>
</template>
