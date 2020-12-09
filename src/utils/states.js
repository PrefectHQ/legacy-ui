export const STATE_COLORS_OLD = {
  Failed: '#eb0000',
  Pending: '#b9dcff',
  Scheduled: '#ffbe1e',
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
  Looped: '#4c4cff'
}

export const STATE_COLORS_BASE_PALETTE = {
  Pending: '#fef3c7',
  Scheduled: '#FCD34D',
  Queued: '#d95b06',
  Paused: '#CE4697',
  Running: '#2EDAFF',
  Submitted: '#FFEF5C',
  Listening: '#16CBDF',
  Cancelling: '#6CA6BE',
  Cancelled: '#7e8696',
  Skipped: '#9ca3af',
  Finished: '#65a097',
  Looped: '#c498a2',
  Resume: '#d9ae82',
  Retrying: '#ec7b57',
  Streaming: '#b799f9',
  Success: '#06E797',
  Cached: '#b9d366',
  Mapped: '#8ae5c4',
  Failed: '#ff4c4c',
  ClientFailed: '#802626',
  TimedOut: '#bf6971',
  TriggerFailed: '#ff9999',
  ValidationFailed: '#bf3251'
}

export const STATE_COLORS = STATE_COLORS_BASE_PALETTE

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
  'Scheduled',
  'Pending',
  'Running',
  'Cancelled',
  'Cancelling',
  'Retrying',
  'Queued',
  'Paused',
  'Mapped',
  'Looped',
  'Skipped',
  'Resume',
  'Paused',
  'Submitted',
  'TriggerFailed'
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

export default function(state) {
  return STATE_COLORS[state]
}
