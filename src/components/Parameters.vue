<script>
import { tryFormatJson } from '@/utils/json'

export default {
  props: {
    hideTitle: {
      type: Boolean,
      required: false,
      default: () => false
    },
    missing: {
      type: Array,
      required: false,
      default: () => []
    },
    parameters: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  computed: {},
  methods: {
    formatDefaultParamValue(defaultParamValue) {
      return tryFormatJson(defaultParamValue)
    },
    paramIsArray(param) {
      return Array.isArray(param)
    },
    paramIsObject(param) {
      return (
        typeof param === 'object' && param != null && !this.paramIsArray(param)
      )
    }
  }
}
</script>

<template>
  <v-list class="pa-0 border-left border-radius-0">
    <v-list-item
      v-for="param in parameters"
      :key="param.name"
      class="px-3"
      :two-line="param.required"
    >
      <v-list-item-content>
        <v-list-item-title v-if="!hideTitle">
          {{ param.name }}
          <v-fade-transition>
            <v-icon
              v-if="param.required && missing.includes(param.name)"
              color="error"
              small
            >
              error
            </v-icon>
          </v-fade-transition>
        </v-list-item-title>
        <v-list-item-subtitle v-if="param.required">
          Required
        </v-list-item-subtitle>
        <v-list-item-subtitle>
          Default:
          {{
            paramIsArray(param.default) || paramIsObject(param.default)
              ? ''
              : JSON.stringify(param.default)
          }}
        </v-list-item-subtitle>
        <code
          v-if="paramIsArray(param.default) || paramIsObject(param.default)"
          class="mt-3 pa-3 no-before-after-content code-custom"
          >{{ formatDefaultParamValue(param.default) }}</code
        >
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<style lang="scss" scoped>
.border-left {
  border-left: 2px solid (var(--v-secondaryGrayLight-base));
}

.border-radius-0 {
  border-radius: 0;
}

.code-custom {
  background-color: var(--v-appBackground-base);
  box-shadow: none;
  color: var(--v-codeBlue-base);
  font-size: 0.9em;
}

.no-before-after-content {
  &::before,
  &::after {
    content: '' !important;
  }
}
</style>
