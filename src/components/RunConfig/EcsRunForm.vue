<template>
  <div class="run-config-form">
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          title="Task Definition"
          description="The source of the task definition to use. If default is selected, the task will use the definition specified by your agent."
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-radio-group v-model="selectedTaskDefinition" mandatory row>
          <v-radio label="Default" :value="taskDefinitions.default" />
          <v-radio label="Template path" :value="taskDefinitions.path" />
          <v-radio label="Template" :value="taskDefinitions.template" />
          <v-radio label="ARN" :value="taskDefinitions.arn" />
        </v-radio-group>
      </v-col>
    </v-row>
    <v-row
      v-if="selectedTaskDefinition == taskDefinitions.path"
      class="run-config-form__row"
    >
      <v-col cols="12" md="6">
        <argument-heading
          argument="task_definition_path"
          title="Template path"
          description="Specify a path to a task definition to use. If this is a local path, the definition will be loaded on initialization and stored on the ECSRun object as the task_definition field. Otherwise the definition will be loaded at runtime by the agent; supported runtime file schemes include s3, gcs, and agent."
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.task_definition_path"
          placeholder="Default"
          label="Template path"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row
      v-if="selectedTaskDefinition == taskDefinitions.template"
      class="run-config-form__row"
    >
      <v-col cols="12" md="6">
        <argument-heading argument="task_definition" title="Template">
          Specify an in-memory task definition spec to use; see the
          <argument-reference
            title="ECS docs"
            href="https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ecs.html#ECS.Client.run_task"
          />
          for more information on task definitions.
        </argument-heading>
      </v-col>
      <v-col cols="12" md="6">
        <multi-line-input v-model="internalValue.task_definition" />
      </v-col>
    </v-row>
    <v-row
      v-if="selectedTaskDefinition == taskDefinitions.arn"
      class="run-config-form__row"
    >
      <v-col cols="12" md="6">
        <argument-heading argument="task_definition_arn" title="Template path">
          Specify a pre-registered task definition ARN to use (either
          <code>family</code>, <code>family:version</code>, or a full task
          definition ARN).
        </argument-heading>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.task_definition_arn"
          placeholder="Default"
          label="ARN"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          argument="image"
          title="Image"
          description="The image to use; if not provided, the image will be inferred from either the flow's storage or the default image configured on the agent."
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.image"
          placeholder="Default"
          label="Image"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          argument="env"
          title="Environment Variables"
          description="Additional environment variables to set on the task."
        />
      </v-col>
      <v-col cols="12" md="6">
        <dict-input :dict="internalValue.env" />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading argument="cpu" title="CPU">
          The CPU made available to the task; see the
          <argument-reference
            title="ECS docs"
            href="https://docs.aws.amazon.com/AmazonECS/latest/userguide/task-cpu-memory-error.html"
          />
          for available values.
        </argument-heading>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.cpu"
          placeholder="Default"
          label="CPU"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading argument="memory" title="Memory">
          The memory made available to the task; see the
          <argument-reference
            title="ECS docs"
            href="https://docs.aws.amazon.com/AmazonECS/latest/userguide/task-cpu-memory-error.html"
          />
          for available values.
        </argument-heading>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.memory"
          placeholder="Default"
          label="Memory"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          argument="task_role_arn"
          title="Task role ARN"
          description="The name or full ARN for the IAM role to use for this task. If not provided, the default on the agent will be used (if configured)."
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.task_role_arn"
          placeholder="Default"
          label="Task role ARN"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          argument="execution_role_arn"
          title="Execution role ARN"
          description="The execution role ARN to use when registering a task definition for this task. If not provided, the default on the agent will be used (if configured)."
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.execution_role_arn"
          placeholder="Default"
          label="Execution role ARN"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading argument="run_task_kwargs" title="Run task arguments">
          Additional key word arguments to pass to <code>run_task</code> when
          starting this task; see the
          <argument-reference
            title="ECS docs"
            href="https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ecs.html#ECS.Client.register_task_definition"
          />
          for more information.
        </argument-heading>
      </v-col>
      <v-col cols="12" md="6">
        <dict-input :dict="internalValue.run_task_kwargs" />
      </v-col>
    </v-row>
  </div>
</template>

<script>
import ArgumentHeading from '@/components/RunConfig/ArgumentHeading'
import ArgumentReference from '@/components/RunConfig/ArgumentReference'
import DictInput from '@/components/CustomInputs/DictInput'
import MultiLineInput from '@/components/CustomInputs/MultiLineInput'

export default {
  components: {
    ArgumentHeading,
    ArgumentReference,
    DictInput,
    MultiLineInput
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
    }
  }
}
</script>
