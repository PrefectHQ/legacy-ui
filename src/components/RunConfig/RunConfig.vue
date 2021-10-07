<script>
/* eslint-disable vue/no-v-html */
import { runConfigs } from '@/utils/runConfigs'
import DictInput from '@/components/CustomInputs/DictInput'
import ListInput from '@/components/CustomInputs/ListInput'
import MenuTooltip from '@/components/MenuTooltip'
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
    MenuTooltip,
    MultiLineInput
  },
  props: {
    value: {
      type: Object,
      required: false,
      default: () => {
        return {
          type: 'UniversalRun'
        }
      }
    }
  },
  data() {
    return {
      internalValue: { type: 'UniversalRun', ...this.value },
      shownArgs: {},
      initialValue: { ...this.value },
      templateType: this.value?.type || 'UniversalRun'
    }
  },
  computed: {
    fields() {
      return Object.keys(this.template.args)
    },
    template() {
      return runConfigs[this.internalValue.type]
    },
    templateArgs() {
      return runConfigs[this.internalValue.type].args
        .map(a =>
          a.options ? a.options.filter(a_ => !!a_.arg).map(a_ => a_.arg) : a.arg
        )
        .flat()
    },
    runConfigs() {
      return runConfigs
    }
  },
  watch: {
    internalValue: {
      handler: function(val) {
        const dict = { type: val.type }
        // Filter values that don't exist as template args
        Object.keys(val).map(key => {
          if (this.templateArgs.includes(key) && !this.valueIsEmpty(val[key])) {
            dict[key] = val[key]
          }
        })

        // Add any missing template args to the emitted internal value
        this.templateArgs.forEach(key => {
          if (key in dict) return
          dict[key] = null
        })

        this.$emit('input', dict)
      },
      deep: true
    },
    templateType: {
      handler: function() {
        this.$emit('input', { ...this.internalValue })
      },
      deep: true
    }
  },
  mounted() {
    this.createArgs()
  },
  methods: {
    createArgs() {
      const dict = {}
      Object.keys(runConfigs).forEach(config => {
        if (!runConfigs[config]) return
        runConfigs[config].args.forEach(arg => {
          if (arg.arg) {
            try {
              dict[arg.arg] =
                JSON.parse(this.value?.[arg.arg]) || nullValues[arg.type]
            } catch {
              dict[arg.arg] = this.value?.[arg.arg] || nullValues[arg.type]
            }
          }

          arg.options?.forEach((option, i) => {
            if (option.arg) {
              try {
                dict[option.arg] =
                  JSON.parse(this.value?.[option.arg]) || nullValues[arg.type]
              } catch (e) {
                dict[option.arg] =
                  this.value?.[option.arg] || nullValues[arg.type]
              }

              if (this.value?.[option.arg]) {
                this.shownArgs[arg.ref] = i
              }
            }
          })
        })
      })
      this.internalValue = { type: this.templateType, ...dict }
    },
    handleArgOptionClick(arg) {
      arg.options.forEach((o, i) => {
        if (!o.arg || !this.template) return
        // If the option arg is defined (not a "default" option), set it to its null value
        this.internalValue[o.arg] =
          this.shownArgs[arg.ref] === i
            ? this.value?.[o.arg] || this.initialValue?.[o.arg]
            : nullValues[this.template.args.find(a => a.arg == o.arg)?.type]
      })
    },
    handleInput(arg, val) {
      this.$set(this.internalValue, arg, val)
    },
    valueIsEmpty(value) {
      if (Array.isArray(value)) {
        return value.length == 0
      }

      if (typeof value == 'string') {
        return value.length == 0
      }

      if (typeof value == 'object') {
        return Object.keys(value).length == 0
      }

      return false
    }
  }
}
</script>

<template>
  <div style="min-width: 100%;">
    <div class="pb-8">
      <div class="config-selection-container">
        <div
          v-for="runConfig in runConfigs"
          :key="runConfig.type"
          v-ripple
          class="config-type py-2 d-flex align-center justify-start px-4 my-2 cursor-pointer user-select-none"
          :class="{ active: internalValue.type == runConfig.type }"
          role="button"
          tabindex="0"
          @click="internalValue.type = runConfig.type"
        >
          <div class="text-center" style="width: 50px;">
            <i :class="runConfig.icon" class="fa-2x pi-2x"> </i>
          </div>

          <div class="w-100 ml-2">
            <span class="text-h6 mr-2"> {{ runConfig.label }}</span>

            <MenuTooltip v-if="$vuetify.breakpoint.mdAndUp">
              <div class="text-body-1 grey--text text--darken-1">
                {{ runConfig.description }}
              </div>
            </MenuTooltip>
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
        <v-col cols="12" md="6">
          <div
            class="pl-md-8 mb-6 mb-md-0 pl-sm-0 py-0"
            :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }"
          >
            <div class="text-h6">
              {{ arg.label }}
              <span
                v-if="arg.arg"
                class="text-caption grey lighten-5 blue-grey--text text--darken-2 rounded-sm ml-1 px-1"
                style="border: 1px solid utilGrayLight !important;"
              >
                {{ arg.arg }}
              </span>
            </div>

            <div class="mt-2 text-body-2" v-html="arg.description" />
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-if="arg.input_type == 'string'"
            v-model="internalValue[arg.arg]"
            placeholder="Default"
            :label="arg.label"
            hide-details
            outlined
            dense
          />
          <MultiLineInput
            v-else-if="arg.input_type == 'multiline'"
            v-model="internalValue[arg.arg]"
          />
          <DictInput
            v-else-if="arg.input_type == 'object'"
            v-model="internalValue[arg.arg]"
            :dict="internalValue[arg.arg]"
          />
          <ListInput
            v-else-if="arg.input_type == 'list'"
            v-model="internalValue[arg.arg]"
            :label="arg.label"
          />

          <div v-else-if="arg.input_type == 'arg_override'">
            <v-radio-group
              v-model="shownArgs[arg.ref]"
              mandatory
              row
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

        <v-col v-for="(option, j) in arg.options" :key="option.label" cols="12">
          <v-row
            v-if="option.arg && shownArgs[arg.ref] == j"
            no-gutters
            class="my-4"
          >
            <v-col cols="12" md="6">
              <div
                class="pl-md-8 mb-6 mb-md-0 pl-sm-0 py-0"
                :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }"
              >
                <div class="text-h6">
                  {{ option.label }}
                  <span
                    v-if="option.arg"
                    class="text-caption grey lighten-5 blue-grey--text text--darken-2 rounded-sm ml-1 px-1"
                    style="border: 1px solid utilGrayLight !important;"
                  >
                    {{ option.arg }}
                  </span>
                </div>

                <div class="mt-2 text-body-2" v-html="option.description" />
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-if="option.input_type == 'string'"
                placeholder="Default"
                class="white"
                :label="option.label"
                hide-details
                outlined
                dense
                @input="handleInput(option.arg, $event)"
              />
              <MultiLineInput
                v-else-if="option.input_type == 'multiline'"
                v-model="internalValue[option.arg]"
                @input="handleInput(option.arg, $event)"
              />
              <DictInput
                v-else-if="option.input_type == 'object'"
                :dict="internalValue[arg.arg]"
                @input="handleInput(option.arg, $event)"
              />
              <ListInput
                v-else-if="option.input_type == 'list'"
                :label="option.label"
                @input="handleInput(option.arg, $event)"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </transition-group>
  </div>
</template>

<style lang="scss" scoped>
.pr-24 {
  padding-right: 124px;
}

.row-divider:not(:last-child) {
  position: relative;

  &::after {
    background-color: var(--v-utilGrayLight-base);
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
  grid-column-gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 195px));
}

.config-type {
  border: 2px solid;
  border-color: var(--v-utilGrayLight-base) !important;
  height: 80px;
  transition: all 50ms;
  width: 100%;

  &.active {
    border-color: var(--v-primary-base) !important;
  }

  &:hover,
  &:focus {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.theme--dark {
  .config-type {
    &:hover,
    &:focus {
      background-color: rgba(255, 255, 255, 0.12);
    }
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
