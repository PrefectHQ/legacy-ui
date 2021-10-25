<template>
  <div class="run-config-form">
    <argument-input
      title="Job template"
      description="The source of the job template to use. If default is selected, the job will use the template specified by your agent."
    >
      <v-radio-group v-model="selectedJobTemplate" mandatory row>
        <v-radio label="Default" :value="jobTemplates.default" />
        <v-radio label="Template path" :value="jobTemplates.path" />
        <v-radio label="Template" :value="jobTemplates.template" />
      </v-radio-group>
    </argument-input>
    <argument-input
      v-if="selectedJobTemplate == jobTemplates.path"
      v-model="internalValue.job_template_path"
      argument="job_template_path"
      title="Template path"
      description="Specify a path to a job template to use. If this is a local path, the job template will be loaded on initialization and stored on the KubernetesRun object as the job template field. Otherwise the job template will be loaded at runtime by the agent; supported runtime file schemes include s3, gcs, and agent."
    />
    <argument-input
      v-if="selectedJobTemplate == jobTemplates.template"
      argument="job_template"
      title="Template"
      description="Specify an in-memory job template to use."
    >
      <resettable-wrapper
        v-model="jobTemplateValue"
        class="resettable-dictionary"
      >
        <code-input v-model="jobTemplateValue" :languages="['json', 'yaml']" />
      </resettable-wrapper>
    </argument-input>
    <argument-input
      v-model="internalValue.image"
      argument="image"
      title="Image"
      description="The image to use."
    />
    <argument-input
      argument="env"
      title="Environment Variables"
      description="Additional environment variables to set on the job."
    >
      <resettable-wrapper v-model="envValue" class="resettable-dictionary">
        <code-input v-model="envValue" />
      </resettable-wrapper>
    </argument-input>
    <argument-input
      v-model="internalValue.cpu_limit"
      argument="cpu_limit"
      title="CPU limit"
    >
      <template slot="description">
        The CPU limit for the job; when this is specified, the kubelet does not
        allow the container to use more than this amount of CPU. See the
        <argument-reference
          title="Kubernetes docs"
          href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"
        />
        for more information.
      </template>
    </argument-input>
    <argument-input
      v-model="internalValue.cpu_request"
      argument="cpu_request"
      title="CPU Request"
    >
      <template slot="description">
        The CPU request for the job; when this is specified, the kubelet
        reserves at least this amount of CPU for the container to use. See the
        <argument-reference
          title="Kubernetes docs"
          href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"
        />
        for more information.
      </template>
    </argument-input>
    <argument-input
      v-model="internalValue.memory_limit"
      argument="memory_limit"
      title="Memory limit"
    >
      <template slot="description">
        The memory limit for the job; when this is specified, the kubelet does
        not allow the container to use more than this amount of memory. See the
        <argument-reference
          title="Kubernetes docs"
          href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"
        />
        for more information.
      </template>
    </argument-input>
    <argument-input
      v-model="internalValue.memory_request"
      argument="memory_request"
      title="Memory request"
    >
      <template slot="description">
        The memory request to use for the job; when this is specified, the
        kubelet reserves at least this amount of memory for the container to
        use. See the
        <argument-reference
          title="Kubernetes docs"
          href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"
        />
        for more information.
      </template>
    </argument-input>
    <argument-input
      v-model="internalValue.service_account_name"
      argument="service_account_name"
      title="Service account name"
      description="A service account name to use for this job. Note: if
          present, this overrides any service account configured on the agent or in
          the job template."
    />
    <argument-input
      argument="image_pull_secrets"
      title="Image"
      description="A list of image pull secrets to use for this job.
          Note: if present, these override any image pull secrets configured on the
          agent or in the job template."
    >
      <list-input
        v-model="internalValue.image_pull_secrets"
        label="Image pull secrets"
      />
    </argument-input>
  </div>
</template>

<script>
import ArgumentInput from '@/components/RunConfig/ArgumentInput'
import ArgumentReference from '@/components/RunConfig/ArgumentReference'
import CodeInput from '@/components/CustomInputs/CodeInput'
import ListInput from '@/components/CustomInputs/ListInput'
import ResettableWrapper from '@/components/CustomInputs/ResettableWrapper'
import { formatJson } from '@/utils/json'

export default {
  components: {
    ArgumentInput,
    ArgumentReference,
    ResettableWrapper,
    CodeInput,
    ListInput
  },
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  data() {
    const jobTemplates = {
      default: 'default',
      path: 'path',
      template: 'template'
    }

    return {
      selectedJobTemplate: jobTemplates.default,
      jobTemplates
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
        return typeof this.internalValue.env === 'object'
          ? formatJson(this.internalValue.env)
          : this.internalValue.env
      },
      set(value) {
        this.internalValue.env = value
      }
    },
    jobTemplateValue: {
      get() {
        return typeof this.internalValue.job_template === 'object'
          ? formatJson(this.internalValue.job_template)
          : this.internalValue.job_template
      },
      set(value) {
        this.internalValue.job_template = value
      }
    }
  }
}
</script>
