<script>
import {
  VListItem,
  VListItemContent,
  VListItemSubtitle,
  VListItemTitle
} from 'vuetify/lib'

export default {
  components: {
    VListItem,
    VListItemContent,
    VListItemSubtitle,
    VListItemTitle
  },
  props: {
    primary: {
      type: String,
      default: () => null,
      required: false
    },
    secondary: {
      type: String,
      default: () => null,
      required: false
    },
    route: {
      type: Object,
      default: () => null,
      required: false
    }
  }
}
</script>

<template functional>
  <component :is="$options.components.VListItem" class="py-2" :to="props.route">
    <component :is="$options.components.VListItemContent">
      <component
        :is="$options.components.VListItemTitle"
        class="text-body-1 text--primary"
        >{{ props.primary }}</component
      >
      <component
        :is="$options.components.VListItemSubtitle"
        class="text-caption text--secondary text-truncate"
      >
        {{ props.secondary }}
      </component>
    </component>
  </component>
</template>
