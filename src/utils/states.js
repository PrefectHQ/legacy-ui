export const STATE_COLORS = {
  Failed: '#eb0000',
  Pending: '#b9dcff',
  Scheduled: '#ffbe1e',
  ScheduledAlt: '#ffeec4',
  Retrying: '#fc7b09',
  Resume: '#f58c0c',
  Queued: '#fff9c2',
  Submitted: '#fff499',
  Paused: '#99a8e8',
  Running: '#27b1ff',
  Listening: '#93d8ff',
  Finished: '#003483',
  Success: '#2cbe4e',
  Cancelled: '#bdbdbd',
  Cancelling: '#E8E8E8',
  Cached: '#74c367',
  TriggerFailed: '#c42800',
  Skipped: '#607583',
  TimedOut: '#dc370b',
  Mapped: '#4067a2',
  Looped: '#4c4cff',
  InProgress: '#93d2cc'
}

export const STATE_TYPES = {
  Failed: 'Finished',
  Pending: 'Pending',
  Scheduled: 'Pending',
  Retrying: 'Pending',
  Resume: 'Pending',
  Submitted: 'Pending',
  Paused: 'Pending',
  Queued: 'Pending',
  Running: 'Running',
  Listening: 'Running',
  Finished: 'Finished',
  Success: 'Finished',
  Cancelled: 'Finished',
  Cancelling: 'Running',
  Cached: 'Finished',
  TriggerFailed: 'Finished',
  Skipped: 'Finished',
  TimedOut: 'Finished',
  Mapped: 'Finished',
  Looped: 'Finished'
}

export const STATE_NAMES = [
  'All',
  'Success',
  'Failed',
  'Finished',
  'Scheduled',
  'Pending',
  'Running',
  'Cancelled',
  'Cancelling',
  'Cached',
  'Retrying',
  'Queued',
  'Paused',
  'Mapped',
  'Looped',
  'Skipped',
  'Resume',
  'Submitted',
  'TriggerFailed',
  'ValidationFailed'
]

export const STATE_PAST_TENSE = {
  Failed: 'failed',
  Pending: 'are pending',
  Scheduled: 'are scheduled',
  Retrying: 'retried',
  Resuming: 'were resumed',
  Submitted: 'are submitted',
  Paused: 'are paused',
  Queued: 'are queued',
  Running: 'are running',
  Listening: 'are listening',
  Finished: 'are finished',
  Success: 'succeeded',
  Cancelled: 'were cancelled',
  Cancelling: 'are cancelling',
  Cached: 'are cached',
  TriggerFailed: 'had failed triggers',
  Skipped: 'were skipped',
  TimedOut: 'timed out',
  Mapped: 'were mapped',
  Looped: 'were looped'
}

export const FINISHED_STATES = [
  'Finished',
  'Looped',
  'Success',
  'Cancelled',
  'Failed',
  'TriggerFailed',
  'ValidationFailed',
  'TimedOut',
  'Cached',
  'Mapped',
  'Skipped'
]

export function calculateDuration(startTime, endTime, state) {
  if (endTime) {
    return endTime
  }

  if (FINISHED_STATES.includes(state)) {
    return startTime
  }

  return null
}

export default function(state) {
  return STATE_COLORS[state]
}
