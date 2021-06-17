export const LocalRun = {
  type: 'LocalRun',
  label: 'Local',
  description: 'Run the flow in a local process on a local agent',
  ref: 'https://docs.prefect.io/api/latest/run_configs.html#localrun',
  icon: 'fad fa-laptop-house',
  args: [
    {
      arg: 'env',
      input_type: 'object',
      label: 'Environment variables',
      description: 'Additional environment variables to set for the process.'
    },
    {
      arg: 'working_dir',
      input_type: 'string',
      label: 'Working directory',
      description:
        'The working directory in which to start the process; the directory must already exist. If not provided, will be run in the same directory as the agent was started.'
    }
  ]
}

export const UniversalRun = {
  type: 'UniversalRun',
  label: 'Universal',
  description: 'Run the flow on any agent with matching labels',
  ref: 'https://docs.prefect.io/api/latest/run_configs.html#universalrun',
  icon: 'fad fa-globe',
  args: [
    {
      arg: 'env',
      input_type: 'object',
      label: 'Environment variables',
      description: 'Additional environment variables to set in the container.'
    }
  ]
}

export const DockerRun = {
  type: 'DockerRun',
  label: 'Docker',
  description: 'Run the flow as a container on a Docker agent',
  ref: 'https://docs.prefect.io/api/latest/run_configs.html#dockerrun',
  icon: 'fab fa-docker',
  args: [
    {
      arg: 'image',
      input_type: 'string',
      label: 'Image',
      description: 'The image to use.'
    },
    {
      arg: 'env',
      input_type: 'object',
      label: 'Environment variables',
      description: 'Additional environment variables to set in the container.'
    }
  ]
}

export const KubernetesRun = {
  type: 'KubernetesRun',
  label: 'Kubernetes',
  description: 'Run the flow as a job on a Kubernetes agent',
  ref: 'https://docs.prefect.io/api/latest/run_configs.html#kubernetesrun',
  icon: 'pi-kubernetes',
  args: [
    {
      arg: null,
      label: 'Job template',
      input_type: 'arg_override',
      description:
        'The source of the job template to use. If default is selected, the job will use the template specified by your agent.',
      ref: 'job_template_choice',
      options: [
        {
          arg: null,
          input_type: null,
          label: 'Default',
          description:
            "Don't specify a template; use the default job configured on the agent instead."
        },
        {
          arg: 'job_template_path',
          input_type: 'string',
          label: 'Template path',
          description:
            'Specify a path to a job template to use. If this is a local path, the job template will be loaded on initialization and stored on the KubernetesRun object as the job template field. Otherwise the job template will be loaded at runtime by the agent; supported runtime file schemes include s3, gcs, and agent.'
        },
        {
          arg: 'job_template',
          input_type: 'multiline',
          label: 'Template',
          description: 'Specify an in-memory job template to use.'
        }
      ]
    },
    {
      arg: 'image',
      input_type: 'string',
      label: 'Image',
      description: 'The image to use.'
    },
    {
      arg: 'env',
      input_type: 'object',
      label: 'Environment variables',
      description: 'Additional environment variables to set on the job.'
    },
    {
      arg: 'cpu_limit',
      input_type: 'string',
      label: 'CPU limit',
      description:
        'The CPU limit for the job; when this is specified, the kubelet does not allow the container to use more than this amount of CPU. See the <a href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/" target="_blank">Kubernetes docs</a><sup><i class="v-icon notranslate material-icons theme--light" style="font-size: 12px !important;">open_in_new</i></sup> for more information.'
    },
    {
      arg: 'cpu_request',
      input_type: 'string',
      label: 'CPU request',
      description:
        'The CPU request for the job; when this is specified, the kubelet reserves at least this amount of CPU for the container to use. See the <a href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/" target="_blank">Kubernetes docs</a><sup><i class="v-icon notranslate material-icons theme--light" style="font-size: 12px !important;">open_in_new</i></sup> for more information.'
    },
    {
      arg: 'memory_limit',
      input_type: 'string',
      label: 'Memory limit',
      description:
        'The memory limit for the job; when this is specified, the kubelet does not allow the container to use more than this amount of memory. See the <a href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/" target="_blank">Kubernetes docs</a><sup><i class="v-icon notranslate material-icons theme--light" style="font-size: 12px !important;">open_in_new</i></sup> for more information.'
    },
    {
      arg: 'memory_request',
      input_type: 'string',
      label: 'Memory request',
      description:
        'The memory request to use for the job; when this is specified, the kubelet reserves at least this amount of memory for the container to use. See the <a href="https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/" target="_blank">Kubernetes docs</a><sup><i class="v-icon notranslate material-icons theme--light" style="font-size: 12px !important;">open_in_new</i></sup> for more information.'
    },
    {
      arg: 'service_account_name',
      input_type: 'string',
      label: 'Service account name',
      description:
        'A service account name to use for this job. Note: if present, this overrides any service account configured on the agent or in the job template.'
    },
    {
      arg: 'image_pull_secrets',
      input_type: 'list',
      label: 'Image pull secrets',
      description:
        'A list of image pull secrets to use for this job. Note: if present, these override any image pull secrets configured on the agent or in the job template.'
    }
  ]
}

export const ECSRun = {
  type: 'ECSRun',
  label: 'ECS',
  description: 'Run the flow as a task on an ECS agent',
  ref: 'https://docs.prefect.io/api/latest/run_configs.html#ecsrun',
  icon: 'fab fa-aws',
  args: [
    {
      arg: null,
      label: 'Task Definition',
      input_type: 'arg_override',
      description:
        'The source of the task definition to use. If default is selected, the task will use the definition specified by your agent.',
      ref: 'task_definition_choice',
      options: [
        {
          arg: null,
          input_type: null,
          label: 'Default',
          description:
            "Don't specify a task definition; use the default definition configured on the agent instead."
        },
        {
          arg: 'task_definition_path',
          input_type: 'string',
          label: 'Template path',
          description:
            'Specify a path to a task definition to use. If this is a local path, the definition will be loaded on initialization and stored on the ECSRun object as the task_definition field. Otherwise the definition will be loaded at runtime by the agent; supported runtime file schemes include s3, gcs, and agent.'
        },
        {
          arg: 'task_definition',
          input_type: 'multiline',
          label: 'Template',
          description:
            'Specify an in-memory task definition spec to use; see the <a href="https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ecs.html#ECS.Client.run_task" target="_blank">ECS docs</a> for more information on task definitions.'
        },
        {
          arg: 'task_definition_arn',
          input_type: 'string',
          label: 'ARN',
          description:
            'Specify a pre-registered task definition ARN to use (either <code>family</code>, <code>family:version</code>, or a full task definition ARN).'
        }
      ]
    },
    {
      arg: 'image',
      input_type: 'string',
      label: 'Image',
      description:
        "The image to use; if not provided, the image will be inferred from either the flow's storage or the default image configured on the agent."
    },
    {
      arg: 'env',
      input_type: 'object',
      label: 'Environment variables',
      description: 'Additional environment variables to set on the task.'
    },
    {
      arg: 'cpu',
      input_type: 'string',
      label: 'CPU',
      description:
        'The CPU made available to the task; see the <a href="https://docs.aws.amazon.com/AmazonECS/latest/userguide/task-cpu-memory-error.html" target="_blank">ECS docs</a><sup><i class="v-icon notranslate material-icons theme--light" style="font-size: 12px !important;">open_in_new</i></sup> for available values.'
    },
    {
      arg: 'memory',
      input_type: 'string',
      label: 'Memory',
      description:
        'The memory made available to the task; see the <a href="https://docs.aws.amazon.com/AmazonECS/latest/userguide/task-cpu-memory-error.html" target="_blank">ECS docs</a><sup><i class="v-icon notranslate material-icons theme--light" style="font-size: 12px !important;">open_in_new</i></sup> for available values.'
    },
    {
      arg: 'task_role_arn',
      input_type: 'string',
      label: 'Task role ARN',
      description:
        'The name or full ARN for the IAM role to use for this task. If not provided, the default on the agent will be used (if configured).'
    },
    {
      arg: 'execution_role_arn',
      input_type: 'string',
      label: 'Execution role ARN',
      description:
        'The execution role ARN to use when registering a task definition for this task. If not provided, the default on the agent will be used (if configured).'
    },
    {
      arg: 'run_task_kwargs',
      input_type: 'object',
      label: 'Run task arguments',
      description:
        'Additional key word arguments to pass to <code>run_task</code> when starting this task; see the <a href="https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ecs.html#ECS.Client.register_task_definition" target="_blank">ECS docs</a><sup><i class="v-icon notranslate material-icons theme--light" style="font-size: 12px !important;">open_in_new</i></sup> for more information.'
    }
  ]
}

export const runConfigs = {
  UniversalRun,
  LocalRun,
  DockerRun,
  KubernetesRun,
  ECSRun
}
