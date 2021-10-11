<template>
  <div class="run-config-form">
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          title="Job template"
          description="The source of the job template to use. If default is selected, the job will use the template specified by your agent."
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-radio-group v-model="selectedJobTemplate" mandatory row>
          <v-radio label="Default" :value="jobTemplates.default" />
          <v-radio label="Template path" :value="jobTemplates.path" />
          <v-radio label="Template" :value="jobTemplates.template" />
        </v-radio-group>
      </v-col>
    </v-row>
    <v-row
      v-if="selectedJobTemplate == jobTemplates.path"
      class="run-config-form__row"
    >
      <v-col cols="12" md="6">
        <argument-heading
          argument="job_template_path"
          title="Template path"
          description="Specify a path to a job template to use. If this is a local path, the job template will be loaded on initialization and stored on the KubernetesRun object as the job template field. Otherwise the job template will be loaded at runtime by the agent; supported runtime file schemes include s3, gcs, and agent."
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.job_template_path"
          placeholder="Default"
          label="Template path"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row
      v-if="selectedJobTemplate == jobTemplates.template"
      class="run-config-form__row"
    >
      <v-col cols="12" md="6">
        <argument-heading
          argument="job_template"
          title="Template"
          description="Specify an in-memory job template to use."
        />
      </v-col>
      <v-col cols="12" md="6">
        <multi-line-input v-model="internalValue.job_template" />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          argument="image"
          title="Image"
          description="The image to use."
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
          description="Additional environment variables to set on the job."
        />
      </v-col>
      <v-col cols="12" md="6">
        <dict-input :dict="internalValue.env" />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading argument="cpu_limit" title="CPU limit">
          The CPU limit for the job; when this is specified, the kubelet does
          not allow the container to use more than this amount of CPU. See the
          <argument-reference
            title="Kubernetes docs"
            href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"
          />
          for more information.
        </argument-heading>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.cpu_limit"
          placeholder="Default"
          label="CPU limit"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading argument="cpu_request" title="CPU Request">
          The CPU request for the job; when this is specified, the kubelet
          reserves at least this amount of CPU for the container to use. See the
          <argument-reference
            title="Kubernetes docs"
            href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"
          />
          for more information.
        </argument-heading>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.cpu_request"
          placeholder="Default"
          label="CPU Request"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading argument="memory_limit" title="Memory limit">
          The memory limit for the job; when this is specified, the kubelet does
          not allow the container to use more than this amount of memory. See
          the
          <argument-reference
            title="Kubernetes docs"
            href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"
          />
          for more information.
        </argument-heading>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.memory_limit"
          placeholder="Default"
          label="Memory limit"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading argument="memory_request" title="Memory request">
          The memory request to use for the job; when this is specified, the
          kubelet reserves at least this amount of memory for the container to
          use. See the
          <argument-reference
            title="Kubernetes docs"
            href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"
          />
          for more information.
        </argument-heading>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.memory_request"
          placeholder="Default"
          label="Memory request"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          argument="service_account_name"
          title="Service account name"
          description="A service account name to use for this job. Note: if
          present, this overrides any service account configured on the agent or in
          the job template."
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.service_account_name"
          placeholder="Default"
          label="Service account name"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          argument="image_pull_secrets"
          title="Image"
          description="A list of image pull secrets to use for this job.
          Note: if present, these override any image pull secrets configured on the
          agent or in the job template."
        />
      </v-col>
      <v-col cols="12" md="6">
        <list-input
          v-model="internalValue.image_pull_secrets"
          label="Image pull secrets"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script>
import ArgumentHeading from '@/components/RunConfig/ArgumentHeading'
import ArgumentReference from '@/components/RunConfig/ArgumentReference'
import DictInput from '@/components/CustomInputs/DictInput'
import MultiLineInput from '@/components/CustomInputs/MultiLineInput'
import ListInput from '@/components/CustomInputs/ListInput'

export default {
  components: {
    ArgumentHeading,
    ArgumentReference,
    DictInput,
    MultiLineInput,
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
    }
  }
}
</script>
