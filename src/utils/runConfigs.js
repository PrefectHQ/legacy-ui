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
      input_type: 'object',
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
      description: ''
    },
    {
      arg: 'job_template',
      input_type: 'string',
      label: 'Job template',
      description: ''
    },
    {
      arg: 'image',
      input_type: 'string',
      label: 'Image',
      description: ''
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
      description: ''
    },
    {
      arg: 'cpu_request',
      input_type: 'string',
      label: 'CPU request',
      description: ''
    },
    {
      arg: 'memory_limit',
      input_type: 'string',
      label: 'Memory limit',
      description: ''
    },
    {
      arg: 'memory_request',
      input_type: 'string',
      label: 'Memory request',
      description: ''
    },
    {
      arg: 'service_account_name',
      input_type: 'string',
      label: 'Service account name',
      description: ''
    },
    {
      arg: 'image_pull_secrets',
      input_type: 'list',
      label: 'Image pull secrets',
      description: ''
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
// export const ECSRun = {}

export const runConfigs = {
  LocalRun,
  UniversalRun,
  DockerRun,
  KubernetesRun
  // ECSRun
}
