<template>
  <div class="run-config-type-select">
    <run-config-type-button
      label="Local"
      icon="fad fa-laptop-house"
      class="run-config-type-select__option"
      :class="{ active: internalValue == 'LocalRun' }"
      description="Run the flow in a local process on a local agent"
      @select="internalValue = 'LocalRun'"
    />
    <run-config-type-button
      label="Universal"
      icon="fad fa-globe"
      class="run-config-type-select__option"
      :class="{ active: internalValue == 'UniversalRun' }"
      description="Run the flow on any agent with matching labels"
      @select="internalValue = 'UniversalRun'"
    />
    <run-config-type-button
      label="Docker"
      icon="fab fa-docker"
      class="run-config-type-select__option"
      :class="{ active: internalValue == 'DockerRun' }"
      description="Run the flow as a container on a Docker agent"
      @select="internalValue = 'DockerRun'"
    />
    <run-config-type-button
      label="Kubernetes"
      icon="pi-kubernetes"
      class="run-config-type-select__option"
      :class="{ active: internalValue == 'KubernetesRun' }"
      description="Run the flow as a job on a Kubernetes agent"
      @select="internalValue = 'KubernetesRun'"
    />
    <run-config-type-button
      label="ECS"
      icon="fab fa-aws"
      class="run-config-type-select__option"
      :class="{ active: internalValue == 'ECSRun' }"
      description="Run the flow as a task on an ECS agent"
      @select="internalValue = 'ECSRun'"
    />
  </div>
</template>

<script>
import RunConfigTypeButton from '@/components/RunConfig/RunConfigTypeButton'

export default {
  components: {
    RunConfigTypeButton
  },
  props: {
    value: {
      type: String,
      required: true
    }
  },
  computed: {
    internalValue: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit('input', value)
      }
    }
  }
}
</script>

<style lang="scss">
.run-config-type-select {
  display: grid;
  grid-column-gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 195px));
}

.run-config-type-select__option {
  display: flex;
  justify-content: start;
  align-items: center;
  padding: 8px 16px;
  margin: 8px 0;
  border: 2px solid;
  border-color: var(--v-utilGrayLight-base) !important;
  transition: all 50ms;
  height: 80px;
  width: 100%;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

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
  .run-config-type-select__option {
    &:hover,
    &:focus {
      background-color: rgba(255, 255, 255, 0.12);
    }
  }
}
</style>
