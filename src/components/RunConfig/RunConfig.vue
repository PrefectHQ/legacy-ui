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
    },
    runConfigs() {
      return runConfigs
    }
  },
  mounted() {
    /* eslint-disable no-console */
    console.log(this.config_)
  },
  methods: {
    handleArgOptionClick(arg) {
      arg.options.forEach(o => {
        if (!o.arg) return
        // If the option arg is defined (not a "default" option), set it to its null value
        this.config_[o.arg] =
          nullValues[this.template.args.find(a => a.arg == o.arg)?.type]
      })
    }
  }
}
</script>

<template>
  <v-container class="pa-0 blue-grey--text text--darken-2">
    <div>
      <div class="text-h5">
        Configuration
      </div>

      <div class="config-selection-container">
        <div
          v-for="runConfig in runConfigs"
          :key="runConfig.type"
          class="config-type white py-2 d-flex align-center justify-start px-4 my-2 cursor-pointer user-select-none"
          :class="{ active: runConfig.type == templateType }"
          @click="templateType = runConfig.type"
        >
          <div class="text-center" style="width: 50px;">
            <i :class="runConfig.icon" class="fa-2x"> </i>
          </div>

          <div class="" style="width: 250px;">
            <div class="text-h6"> {{ runConfig.label }}</div>
            <div class="text-body-1 grey--text text--darken-1">
              {{ runConfig.description }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition-group name="fade" mode="out-in">
      <v-row
        v-for="(arg, i) in template.args"
        :key="arg.arg || i"
        class="my-2 py-8 row-divider"
        no-gutters
      >
        <v-col cols="12" md="6" class="pr-24">
          <div class="text-h6">
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
        </v-col>

        <v-col cols="12" md="6" class="mt-md-0 mt-sm-8 mt-xs-8">
          <v-text-field
            v-if="arg.input_type == 'string'"
            v-model="config_[arg.arg]"
            placeholder="Default"
            class="white"
            :label="arg.label"
            hide-details
            outlined
            dense
          />
          <MultiLineInput
            v-else-if="arg.input_type == 'multiline'"
            v-model="config_[arg.arg]"
          />
          <DictInput
            v-else-if="arg.input_type == 'object'"
            v-model="config_[arg.arg]"
          />
          <ListInput
            v-else-if="arg.input_type == 'list'"
            v-model="config_[arg.arg]"
          />

          <div v-else-if="arg.input_type == 'arg_override'">
            <v-radio-group
              v-model="shownArgs[arg.ref]"
              mandatory
              @change="handleArgOptionClick(arg)"
            >
              <v-radio
                v-for="(option, j) in arg.options"
                :key="j"
                :label="option.label"
                :value="j"
              ></v-radio>
            </v-radio-group>
          </div>
        </v-col>

        <v-fade-transition mode="out-in">
          <v-col v-if="shownArgs[arg.ref]" cols="12">
            <v-row no-gutters class="my-4">
              <v-col cols="12" md="6" class="pl-md-8 pr-24 pl-sm-0">
                <div class="text-h6">
                  {{ arg.options[shownArgs[arg.ref]].label }}
                  <span
                    v-if="arg.arg"
                    class="caption grey lighten-5 blue-grey--text text--darken-2 rounded-sm ml-1 px-1"
                    style="border: 1px solid #b0bec5 !important;"
                  >
                    {{ arg.arg }}
                  </span>
                </div>

                <div
                  class="mt-2 text-body-2"
                  v-html="arg.options[shownArgs[arg.ref]].description"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-if="arg.options[shownArgs[arg.ref]].input_type == 'string'"
                  v-model="config_[arg.options[shownArgs[arg.ref]].arg]"
                  placeholder="Default"
                  class="white"
                  :label="arg.options[shownArgs[arg.ref]].label"
                  hide-details
                  outlined
                  dense
                />
                <MultiLineInput
                  v-else-if="
                    arg.options[shownArgs[arg.ref]].input_type == 'multiline'
                  "
                  v-model="config_[arg.options[shownArgs[arg.ref]]]"
                />
                <DictInput
                  v-else-if="
                    arg.options[shownArgs[arg.ref]].input_type == 'object'
                  "
                  v-model="config_[arg.options[shownArgs[arg.ref]]]"
                />
                <ListInput
                  v-else-if="
                    arg.options[shownArgs[arg.ref]].input_type == 'list'
                  "
                  v-model="config_[arg.options[shownArgs[arg.ref]]]"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-fade-transition>
      </v-row>
    </transition-group>
  </v-container>
</template>

<style lang="scss" scoped>
.pr-24 {
  padding-right: 124px;
}

.row-divider:not(:last-child) {
  position: relative;

  &::after {
    background-color: #ddd;
    bottom: 0;
    content: '';
    height: 1px;
    margin: auto;
    position: absolute;
    width: 100%;
  }
}

.w-50 {
  width: 50%;
}

.w-100 {
  width: 100%;
}

.config-selection-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
}

.config-type {
  border: 2px solid;
  border-color: #ddd !important;
  height: 110px;
  width: 350px;

  &.active {
    border-color: var(--v-primary-base) !important;
  }
}
</style>

<style lang="scss">
.config-type {
  &.active {
    .svg-inline--fa path {
      fill: var(--v-primary-base) !important;
    }
  }
}
</style>
