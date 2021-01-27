<script>
/* eslint-disable vue/no-v-html */
import { runConfigs } from '@/utils/runConfigs'
import DictInput from '@/components/CustomInputs/DictInput'
import ListInput from '@/components/CustomInputs/ListInput'
import MultiLineInput from '@/components/CustomInputs/MultiLineInput'

const nullValues = {
  list: [],
  multiline: null,
  object: {},
  string: null
}

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
      config_: this.config,
      shownArgs: {},
      templateType: this.config.type
    }
  },
  computed: {
    fields() {
      return Object.keys(this.template.args)
    },
    template() {
      return runConfigs[this.templateType]
    }
  },
  watch: {
    templateType() {
      this.updateShownArgs()
    }
  },
  mounted() {
    /* eslint-disable no-console */
    console.log(this.config_)

    this.updateShownArgs()
  },
  methods: {
    handleArgOptionClick(arg, index) {
      arg.options.forEach(o => {
        if (!o.arg) return
        // If the option arg is defined (not a "default" option), set it to its null value
        this.config_[o.arg] =
          nullValues[this.template.args.find(a => a.arg == o.arg)?.type]
      })

      this.$set(this.shownArgs, arg.ref, index)
    },
    updateShownArgs() {
      this.$set(this.shownArgs, {})
      // this.shownArgs = {}
      this.template.args
        .filter(a => a.input_type == 'arg_override')
        .forEach(a => {
          // When the template changes, find all the arg override options that
          // are defined in the config...
          // If none are defined, we default to the first option.
          const optionIndex = a.options.findIndex(o => !!this.config_[o.arg])
          this.$set(this.shownArgs, a.ref, optionIndex > -1 ? optionIndex : 0)
        })
    }
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
          v-if="arg.arg"
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
        hide-details
      />
      <MultiLineInput v-else-if="arg.input_type == 'multiline'" />
      <DictInput v-else-if="arg.input_type == 'object'" />
      <ListInput v-else-if="arg.input_type == 'list'" />

      <div v-else-if="arg.input_type == 'arg_override'">
        <div
          v-for="(option, j) in arg.options"
          :key="j"
          class="arg-override-option rounded d-inline-block mr-8 mt-4 cursor-pointer px-4 py-2"
          :class="{ active: shownArgs[arg.ref] === j }"
          @click="handleArgOptionClick(arg, j)"
        >
          <div
            class="text-h6"
            :class="{ 'primary--text': shownArgs[arg.ref] === j }"
          >
            {{ option.label }}
          </div>

          <div class="arg-override-option-description">
            <div class="mt-2 text-body-2" v-html="option.description" />
          </div>
        </div>
        <v-fade-transition mode="out-in">
          <div v-if="shownArgs[arg.ref] && arg.options[shownArgs[arg.ref]].arg">
            <div class="text-h6 primary--text">
              {{ arg.options[shownArgs[arg.ref]].label }}
              <span
                v-if="arg.options[shownArgs[arg.ref]].arg"
                class="caption grey lighten-5 blue-grey--text text--darken-2 rounded-sm ml-1 px-1"
                style="border: 1px solid #b0bec5 !important;"
              >
                {{ arg.options[shownArgs[arg.ref]].arg }}
              </span>
            </div>

            <div
              class="mt-2 text-body-2"
              v-html="arg.options[shownArgs[arg.ref]].description"
            />

            <v-text-field
              v-if="arg.options[shownArgs[arg.ref]].input_type == 'string'"
              v-model="config_[arg.options[shownArgs[arg.ref]].arg]"
              :placeholder="arg.options[shownArgs[arg.ref]].label"
            />
            <MultiLineInput
              v-else-if="
                arg.options[shownArgs[arg.ref]].input_type == 'multiline'
              "
            />
            <DictInput
              v-else-if="arg.options[shownArgs[arg.ref]].input_type == 'object'"
            />
            <ListInput
              v-else-if="arg.options[shownArgs[arg.ref]].input_type == 'list'"
            />
          </div>
        </v-fade-transition>
      </div>
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

.arg-override-option {
  border: 2px solid;
  border-color: #ddd;
  height: 225px;
  width: 300px;

  &.active {
    border-color: var(--v-primary-base);
  }

  .arg-override-option-description {
    height: 175px;
    overflow-y: auto;
  }
}
</style>
