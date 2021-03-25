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

//Can use requiresCloud or specific permission type to filter where needed
export const actionTypes = [
  {
    title: 'Email',
    type: 'EMAIL',
    verb: 'email',
    icon: 'fas fa-envelope',
    config: { to: null },
    requiresCloud: true
  },
  {
    title: 'Slack',
    type: 'SLACK_WEBHOOK',
    verb: 'slack',
    icon: 'fab fa-slack',
    config: { url: null },
    requiresCloud: false
  },
  {
    title: 'Twilio',
    type: 'TWILIO',
    verb: 'twilio',
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
    title: 'Pager Duty',
    type: 'PAGERDUTY',
    verb: 'PagerDuty',
    icon: '$pagerDuty',
    config: { routing_key: null, api_token: null, severity: [] },
    requiresCloud: false
  }
]

export const featureFlaggedEventTypes = [...actionTypes]

export const flowEventTypes = [
  { name: 'does not finish', enum: 'STARTED_NOT_FINISHED' },
  {
    name: 'does not start',
    enum: 'SCHEDULED_NOT_STARTED'
  },
  {
    name: 'changes state',
    enum: 'CHANGES_STATE'
  }
]

export const AUTOMATIONSTATES = {
  All: [
    'Failed',
    'Pending',
    'Scheduled',
    'Retrying',
    'Resume',
    'Queued',
    'Submitted',
    'Paused',
    'Running',
    'Finished',
    'Success',
    'Cancelled',
    'Cached',
    'Triggerfailed',
    'Skipped',
    'Timedout',
    'Mapped',
    'Looped'
  ],
  Failed: ['Failed', 'Timedout', 'Triggerfailed'],
  Finished: [
    'Finished',
    'Looped',
    'Cancelled',
    'Success',
    'Cached',
    'Mapped',
    'Skipped'
  ],
  Success: ['Success', 'Cached', 'Mapped', 'Skipped'],
  Custom: []
}
