export const openCloudHookTypes = [
  {
    title: 'Email',
    type: 'EMAIL',
    icon: 'fas fa-envelope',
    config: { to: null }
  },
  {
    title: 'Slack',
    type: 'SLACK_WEBHOOK',
    icon: 'fab fa-slack',
    config: { url: null }
  },
  {
    title: 'Twilio',
    type: 'TWILIO',
    icon: '$twilio',
    config: {
      account_sid: null,
      auth_token: null,
      to: [],
      messaging_service_sid: null
    }
  },
  {
    title: 'Pager Duty',
    type: 'PAGERDUTY',
    icon: '$pagerDuty',
    config: { routing_key: null, api_token: null, severity: [] }
  },
  {
    title: 'Web',
    type: 'WEBHOOK',
    icon: 'fas fa-desktop',
    config: { to: null }
  },
  {
    title: 'Prefect',
    type: 'PREFECT_MESSAGE',
    icon: '$prefect',
    config: {}
  }
]

export const featureFlaggedCloudHookTypes = [...openCloudHookTypes]

export const GROUP_COLORS = {
  All: 'primary',
  Custom: 'codePink',
  Failed: 'Failed',
  Finished: 'Finished',
  Success: 'Success'
}

export const STATES = {
  All: [
    'FAILED',
    'PENDING',
    'SCHEDULED',
    'RETRYING',
    'RESUME',
    'QUEUED',
    'SUBMITTED',
    'PAUSED',
    'RUNNING',
    'FINISHED',
    'SUCCESS',
    'CANCELLED',
    'CACHED',
    'TRIGGERFAILED',
    'SKIPPED',
    'TIMEDOUT',
    'MAPPED',
    'LOOPED'
  ],
  Failed: ['FAILED', 'TIMEDOUT', 'TRIGGERFAILED'],
  Finished: [
    'FINISHED',
    'LOOPED',
    'CANCELLED',
    'SUCCESS',
    'CACHED',
    'MAPPED',
    'SKIPPED'
  ],
  Success: ['SUCCESS', 'CACHED', 'MAPPED', 'SKIPPED']
}
