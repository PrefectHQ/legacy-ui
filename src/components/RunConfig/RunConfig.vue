<script>
/* eslint-disable vue/no-v-html */
import { runConfigs } from '@/utils/runConfigs'
import MenuTooltip from '@/components/MenuTooltip'
import UniversalRunForm from '@/components/RunConfig/UniversalRunForm'
import LocalRunForm from '@/components/RunConfig/LocalRunForm'
import DockerRunForm from '@/components/RunConfig/DockerRunForm'
import KubernetesRunForm from '@/components/RunConfig/KubernetesRunForm'
import EcsRunForm from '@/components/RunConfig/EcsRunForm'

const nullValues = {
  list: [],
  multiline: null,
  object: {},
  string: null
}

export default {
  components: {
    MenuTooltip
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
    formComponent() {
      switch (this.value.type) {
        case 'LocalRun':
          return LocalRunForm
        case 'DockerRun':
          return DockerRunForm
        case 'KubernetesRun':
          return KubernetesRunForm
        case 'ECSRun':
          return EcsRunForm
        default:
          return UniversalRunForm
      }
    },
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
          if (this.templateArgs.includes(key)) {
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

    <component :is="formComponent" v-model="internalValue" />
  </div>
</template>

<style lang="scss">
.run-config-form__row {
  max-width: var(--v-lg);
  margin: 0;
}

.run-config-form__input {
  margin-top: 26px;
}

.run-config-form__input .v-input-radio-group {
  margin-top: -26px;
  justify-content: center;
}

.run-config-form__input .list-input {
  margin-top: -26px;
}

.run-config-form__input .multiline-input {
  margin-top: -26px;
}

.run-config-form__input .dict-input {
  margin-top: -36px;
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

    .svg-inline--fa path {
      fill: var(--v-primary-base) !important;
    }

    .pi-kubernetes::before {
      color: var(--v-primary-base) !important;
    }
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
