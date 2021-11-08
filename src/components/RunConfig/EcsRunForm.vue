<template>
  <div class="run-config-form">
    <argument-input
      title="Task Definition"
      description="The source of the task definition to use. If default is selected, the task will use the definition specified by your agent."
    >
      <v-radio-group v-model="selectedTaskDefinition" mandatory row>
        <v-radio label="Default" :value="taskDefinitions.default" />
        <v-radio label="Template path" :value="taskDefinitions.path" />
        <v-radio label="Template" :value="taskDefinitions.template" />
        <v-radio label="ARN" :value="taskDefinitions.arn" />
      </v-radio-group>
    </argument-input>
    <template v-if="selectedTaskDefinition == taskDefinitions.path">
      <argument-input
        v-model="internalValue.task_definition_path"
        argument="task_definition_path"
        title="Template path"
        description="Specify a path to a task definition to use. If this is a local path, the definition will be loaded on initialization and stored on the ECSRun object as the task_definition field. Otherwise the definition will be loaded at runtime by the agent; supported runtime file schemes include s3, gcs, and agent."
      />
    </template>
    <template v-if="selectedTaskDefinition == taskDefinitions.template">
      <argument-input argument="task_definition" title="Template">
        <template slot="description">
          Specify an in-memory task definition spec to use; see the
          <argument-reference
            title="ECS docs"
            href="https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ecs.html#ECS.Client.run_task"
          />
          for more information on task definitions.
        </template>
        <resettable-wrapper
          v-model="taskDefinitionValue"
          class="resettable-dictionary-json"
        >
          <code-input
            ref="taskDefinitionInput"
            v-model="taskDefinitionValue"
            :editors="['json', 'yaml']"
          />
        </resettable-wrapper>
      </argument-input>
    </template>
    <template v-if="selectedTaskDefinition == taskDefinitions.arn">
      <argument-input
        v-model="internalValue.task_definition_arn"
        argument="task_definition_arn"
        title="ARN"
      >
        <template slot="description">
          Specify a pre-registered task definition ARN to use (either
          <code>family</code>, <code>family:version</code>, or a full task
          definition ARN).
        </template>
      </argument-input>
    </template>
    <argument
      v-model="internalValue.image"
      argument="image"
      title="Image"
      description="The image to use; if not provided, the image will be inferred from either the flow's storage or the default image configured on the agent."
    />
    <argument-input
      argument="env"
      title="Environment Variables"
      description="Additional environment variables to set on the task."
    >
      <resettable-wrapper v-model="envValue" class="resettable-dictionary-json">
        <code-input ref="envInput" v-model="envValue" show-types />
      </resettable-wrapper>
    </argument-input>
    <argument-input v-model="internalValue.cpu" argument="cpu" title="CPU">
      <template slot="description">
        The CPU made available to the task; see the
        <argument-reference
          title="ECS docs"
          href="https://docs.aws.amazon.com/AmazonECS/latest/userguide/task-cpu-memory-error.html"
        />
        for available values.
      </template>
    </argument-input>
    <argument-input
      v-model="internalValue.memory"
      argument="memory"
      title="Memory"
    >
      <template slot="description">
        The memory made available to the task; see the
        <argument-reference
          title="ECS docs"
          href="https://docs.aws.amazon.com/AmazonECS/latest/userguide/task-cpu-memory-error.html"
        />
        for available values.
      </template>
    </argument-input>
    <argument
      v-model="internalValue.task_role_arn"
      argument="task_role_arn"
      title="Task role ARN"
      description="The name or full ARN for the IAM role to use for this task. If not provided, the default on the agent will be used (if configured)."
    />
    <argument
      v-model="internalValue.execution_role_arn"
      argument="execution_role_arn"
      title="Execution role ARN"
      description="The execution role ARN to use when registering a task definition for this task. If not provided, the default on the agent will be used (if configured)."
    />
    <argument-input argument="run_task_kwargs" title="Run task arguments">
      <template slot="description">
        Additional key word arguments to pass to <code>run_task</code> when
        starting this task; see the
        <argument-reference
          title="ECS docs"
          href="https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ecs.html#ECS.Client.register_task_definition"
        />
        for more information.
      </template>
      <resettable-wrapper
        v-model="runTaskKwargsValue"
        class="resettable-dictionary-json"
      >
        <code-input
          ref="runTaskKwargsInput"
          v-model="runTaskKwargsValue"
          show-types
        />
      </resettable-wrapper>
    </argument-input>
  </div>
</template>

<script>
import ArgumentInput from '@/components/RunConfig/ArgumentInput'
import ArgumentReference from '@/components/RunConfig/ArgumentReference'
import CodeInput from '@/components/CustomInputs/CodeInput'
import ResettableWrapper from '@/components/CustomInputs/ResettableWrapper'
import { tryFormatJson } from '@/utils/json'

export default {
  components: {
    ArgumentInput,
    ArgumentReference,
    ResettableWrapper,
    CodeInput
  },
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  data() {
    const taskDefinitions = {
      default: 'default',
      path: 'path',
      template: 'template',
      arn: 'arn'
    }

    return {
      selectedTaskDefinition: taskDefinitions.default,
      taskDefinitions
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
    },
    envValue: {
      get() {
        return tryFormatJson(this.internalValue.env)
      },
      set(value) {
        this.internalValue = { ...this.internalValue, env: value }
      }
    },
    taskDefinitionValue: {
      get() {
        return tryFormatJson(this.internalValue.task_definition)
      },
      set(value) {
        this.internalValue = { ...this.internalValue, task_definition: value }
      }
    },
    runTaskKwargsValue: {
      get() {
        return tryFormatJson(this.internalValue.run_task_kwargs)
      },
      set(value) {
        this.internalValue = { ...this.internalValue, run_task_kwargs: value }
      }
    }
  },
  methods: {
    validate() {
      return (
        this.$refs.taskDefinitionInput.validate() &&
        this.$refs.envInput.validate() &&
        this.$refs.runTaskKwargsInput.validate()
      )
    }
  }
}
</script>
