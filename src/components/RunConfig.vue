<script>
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
  }
}
</script>

<template>
  <v-container>
    <div v-for="(arg, i) in template.args" :key="i" class="my-2">
      <div class="title primary--text">
        {{ arg.label }}
        <span class="caption grey--text ml-1">{{ arg.arg }}</span>
      </div>
      <div class="mt-2">
        {{ arg.description }}
      </div>

      <v-text-field
        v-if="arg.input_type == 'string'"
        v-model="config_[arg.arg]"
        :placeholder="arg.label"
      />
      <MultiLineInput v-else-if="arg.input_type == 'multiline'" />
      <DictInput v-else-if="arg.input_type == 'object'" />
      <ListInput v-else-if="arg.input_type == 'list'" />
    </div>
  </v-container>
</template>
