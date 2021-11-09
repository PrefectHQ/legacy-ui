export const presentTenseStates = {
  FAILED: 'fails',
  PENDING: 'is pending',
  SCHEDULED: 'is scheduled',
  RETRYING: 'retries',
  RESUME: 'resumes',
  QUEUED: 'is queued',
  SUBMITTED: 'is submitted',
  PAUSED: 'pauses',
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
  RESUME: 'resumes',
  Queued: 'is queued',
  Submitted: 'is submitted',
  PAUSED: 'pauses',
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
    actionType: 'EmailNotificationAction',
    verb: 'email',
    sendText: 'Send an',
    icon: 'fas fa-envelope',
    config: { to: null },
    requiresCloud: true
  },
  {
    title: 'Slack',
    type: 'SLACK_WEBHOOK',
    actionType: 'SlackNotificationAction',
    verb: 'slack',
    sendText: 'Send a',
    icon: 'fab fa-slack',
    config: { url: null },
    requiresCloud: false
  },
  {
    title: 'Twilio',
    type: 'TWILIO',
    actionType: 'TwilioNotificationAction',
    sendText: 'Send a',
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
    title: 'PagerDuty',
    sendText: 'Send a',
    type: 'PAGERDUTY',
    actionType: 'PagerDutyNotificationAction',
    verb: 'PagerDuty',
    icon: '$pagerDuty',
    config: { routing_key: null, api_token: null, severity: [] },
    requiresCloud: false
  },
  {
    title: 'Microsoft Teams',
    sendText: 'Send a',
    type: 'MS_TEAMS',
    actionType: 'TeamsWebhookNotificationAction',
    verb: 'teams',
    icon: 'fab fa-microsoft',
    config: { webhook_url_secret: null, message: null, title: null },
    requiresCloud: true
  },
  {
    title: 'Webhook',
    sendText: 'Send a',
    verb: 'send webhook to',
    type: 'WEBHOOK',
    icon: 'fas fa-desktop',
    config: { to: null },
    requiresCloud: false
  }
]

export const featureFlaggedEventTypes = [...actionTypes]

export const flowEventTypes = [
  {
    name: 'changes state',
    enum: 'CHANGES_STATE',
    permission: null
  },
  {
    name: 'does not finish',
    enum: 'STARTED_NOT_FINISHED',
    permission: 'feature:flow-sla'
  },
  {
    name: 'does not start',
    enum: 'SCHEDULED_NOT_STARTED',
    permission: 'feature:flow-sla'
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

export const jsonPlacehold = {
  jsonBlob: {
    event_name: '{event_type}',
    message: '',
    tenant_id: '{tenant_id}',
    tenant_slug: '{tenant_slug}',
    timestamp: '',
    id: '{event_id}',
    flow_id: '{flow_id}',
    flow_name: '{flow_name}',
    flow_group_id: '{flow_group_id}',
    flow_link: '{flow_link}',
    flow_run_id: '{flow_run_id}',
    flow_run_name: '{flow_run_name}',
    state: '{state}',
    state_message: '{state_message}',
    flow_run_link: '{flow_run_link}',
    flow_sla_config_id: '{flow_sla_config_id}',
    kind: '{flow_sla_type}',
    duration_seconds: '{duration}',
    event_type: '{event_type}'
  }
}
