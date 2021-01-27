export const LocalRun = {
  label: 'Local',
  description: 'Run the flow in a local process',
  ref: 'https://docs.prefect.io/api/latest/run_configs.html#localrun',
  icon: '',
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
    },
    {
      arg: 'labels',
      input_type: 'list',
      label: 'Labels',
      description:
        'Labels are identifiers used by Prefect Agents for selecting flow runs when polling for work. Labels that exist on both the run and the agent will be submitted!'
    }
  ]
}

export const UniversalRun = {
  label: 'Universal',
  description: 'Run the flow on any agent with matching labels',
  ref: 'https://docs.prefect.io/api/latest/run_configs.html#universalrun',
  icon: '',
  args: [
    {
      arg: 'labels',
      input_type: 'list',
      label: 'Labels',
      description:
        'Labels are identifiers used by Prefect Agents for selecting flow runs when polling for work. Labels that exist on both the run and the agent will be submitted!'
    }
  ]
}

export const DockerRun = {
  label: 'Docker',
  description: 'Run the flow as a Docker container',
  ref: 'https://docs.prefect.io/api/latest/run_configs.html#dockerrun',
  icon: '',
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
    },
    {
      arg: 'labels',
      input_type: 'list',
      label: 'Labels',
      description:
        'Labels are identifiers used by Prefect Agents for selecting flow runs when polling for work. Labels that exist on both the run and the agent will be submitted!'
    }
  ]
}

export const KubernetesRun = {
  label: 'Kubernetes',
  description: 'Run the flow as a Kubernetes job',
  ref: 'https://docs.prefect.io/api/latest/run_configs.html#kubernetesrun',
  icon: '',
  args: [
    {
      arg: 'job_template_path',
      input_type: 'string',
      label: 'Job template path',
      description:
        'The path to a job template to use. If this is a local path, the job template will be loaded on initialization and store on the KubernetesRun object as the job template field. Otherwise the job template will be loaded at runtime by the agent; supported runtime file schemes include s3, gcs, and agent.'
    },
    {
      arg: 'job_template',
      input_type: 'multiline',
      label: 'Job template',
      description: 'An in-memory job template to use.'
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
      description: 'The CPU limit for the job.'
    },
    {
      arg: 'cpu_request',
      input_type: 'string',
      label: 'CPU request',
      description: 'The CPU request for the job.'
    },
    {
      arg: 'memory_limit',
      input_type: 'string',
      label: 'Memory limit',
      description: 'The memory limit for the job.'
    },
    {
      arg: 'memory_request',
      input_type: 'string',
      label: 'Memory request',
      description: 'The memory request to use for the job.'
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
    },
    {
      arg: 'labels',
      input_type: 'list',
      label: 'Labels',
      description:
        'Labels are identifiers used by Prefect Agents for selecting flow runs when polling for work. Labels that exist on both the run and the agent will be submitted!'
    }
  ]
}

// TODO: Add ECSRun
export const ECSRun = {}

export const runConfigs = {
  LocalRun,
  UniversalRun,
  DockerRun,
  KubernetesRun,
  ECSRun
}
