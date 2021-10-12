<template>
  <div v-ripple role="button" tabindex="0" @click="$emit('select')">
    <div class="text-center" style="width: 50px;">
      <i :class="icon" class="fa-2x pi-2x"> </i>
    </div>

    <div class="w-100 ml-2">
      <span class="text-h6 mr-2"> {{ label }}</span>

      <menu-tooltip v-if="$vuetify.breakpoint.mdAndUp">
        <div class="text-body-1 grey--text text--darken-1">
          {{ description }}
        </div>
      </menu-tooltip>
    </div>
  </div>
</template>

<script>
import MenuTooltip from '@/components/MenuTooltip'

export default {
  components: {
    MenuTooltip
  },
  props: {
    label: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    }
  }
}
</script>
