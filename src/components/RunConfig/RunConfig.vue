<script>
import RunConfigTypeSelect from '@/components/RunConfig/RunConfigTypeSelect'
import UniversalRunForm from '@/components/RunConfig/UniversalRunForm'
import LocalRunForm from '@/components/RunConfig/LocalRunForm'
import DockerRunForm from '@/components/RunConfig/DockerRunForm'
import KubernetesRunForm from '@/components/RunConfig/KubernetesRunForm'
import EcsRunForm from '@/components/RunConfig/EcsRunForm'

export default {
  components: {
    RunConfigTypeSelect
  },
  props: {
    value: {
      type: Object,
      required: true
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
        case 'UniversalRun':
        default:
          return UniversalRunForm
      }
    },
    internalValue: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit('input', value)
      }
    }
  },
  methods: {
    validate() {
      return this.$refs.runConfigForm.validate()
    }
  }
}
</script>

<template>
  <div style="min-width: 100%">
    <run-config-type-select v-model="internalValue.type" class="pb-8" />
    <component
      :is="formComponent"
      ref="runConfigForm"
      v-model="internalValue"
    />
  </div>
</template>

<style lang="scss">
.run-config-form__row {
  max-width: var(--v-lg);
  margin: 0;
}

@media (min-width: 960px) {
  .run-config-form__input > .v-input {
    margin-top: 26px;
  }
}
</style>
