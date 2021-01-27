<script>
/* eslint-disable vue/no-v-html */
import { runConfigs } from '@/utils/runConfigs'
import DictInput from '@/components/CustomInputs/DictInput'
import ListInput from '@/components/CustomInputs/ListInput'
import MultiLineInput from '@/components/CustomInputs/MultiLineInput'

export default {
  components: {
    DictInput,
    ListInput,
    MultiLineInput
  },
  props: {
    config: {
      type: Object,
      required: false,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      config_: this.config
    }
  },
  computed: {
    fields() {
      return Object.keys(this.template.args)
    },
    template() {
      return runConfigs[this.config.type]
    }
  },
  mounted() {
    /* eslint-disable no-console */
    console.log(this.config_)
  }
}
</script>

<template>
  <div class="">
    <div
      v-for="(arg, i) in template.args"
      :key="i"
      class="my-2 d-inline-block pa-4"
      :class="arg.input_type == 'string' ? 'w-50' : 'w-100'"
    >
      <div class="text-h6 primary--text">
        {{ arg.label }}
        <span
          class="caption grey lighten-5 blue-grey--text text--darken-2 rounded-sm ml-1 px-1"
          style="border: 1px solid #b0bec5 !important;"
        >
          {{ arg.arg }}
        </span>
      </div>

      <div class="mt-2 text-body-2" v-html="arg.description" />

      <v-text-field
        v-if="arg.input_type == 'string'"
        v-model="config_[arg.arg]"
        :placeholder="arg.label"
      />
      <MultiLineInput v-else-if="arg.input_type == 'multiline'" />
      <DictInput v-else-if="arg.input_type == 'object'" />
      <ListInput v-else-if="arg.input_type == 'list'" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.w-50 {
  width: 50%;
}

.w-100 {
  width: 100%;
}
</style>
