export const openCloudHookTypes = [
  {
    title: 'Email',
    type: 'EMAIL',
    icon: 'fas fa-envelope',
    config: { to: null },
    requiresCloud: true
  },
  {
    title: 'Slack',
    type: 'SLACK_WEBHOOK',
    icon: 'fab fa-slack',
    config: { url: null },
    requiresCloud: false
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
    },
    requiresCloud: false
  },
  {
    title: 'PagerDuty',
    type: 'PAGERDUTY',
    icon: '$pagerDuty',
    config: { routing_key: null, api_token: null, severity: [] },
    requiresCloud: false
  },
  {
    title: 'Web',
    type: 'WEBHOOK',
    icon: 'fas fa-desktop',
    config: { to: null },
    requiresCloud: false
  },
  {
    title: 'Prefect',
    type: 'PREFECT_MESSAGE',
    icon: '$prefect',
    config: {},
    requiresCloud: false
  }
]

export const presentTenseStates = {
  FAILED: 'fails',
  PENDING: 'is pending',
  SCHEDULED: 'is scheduled',
  RETRYING: 'retries',
  // RESUME: 'resumes',
  QUEUED: 'is queued',
  SUBMITTED: 'is submitted',
  // PAUSED: 'pauses',
  RUNNING: 'runs',
  FINISHED: 'finishes',
  SUCCESS: 'succeeds',
  CANCELLED: 'is cancelled',
  CACHED: 'is cached',
  TRIGGERFAILED: 'trigger fails',
  SKIPPED: 'skips',
  TIMEDOUT: 'times out',
  MAPPED: 'maps',
  LOOPED: 'loops'
}

export const titleCasePresentTenseStates = {
  Failed: 'fails',
  Pending: 'is pending',
  Scheduled: 'is scheduled',
  Retrying: 'retries',
  // RESUME: 'resumes',
  Queued: 'is queued',
  Submitted: 'is submitted',
  // PAUSED: 'pauses',
  Running: 'runs',
  Finished: 'finishes',
  Success: 'succeeds',
  Cancelled: 'is cancelled',
  Cached: 'is cached',
  Triggerfailed: 'trigger fails',
  Skipped: 'skips',
  Timedout: 'times out',
  Mapped: 'maps',
  Looped: 'loops'
}

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
