import { FINISHED_STATES } from '@/utils/states'

function isFinished(state) {
  return FINISHED_STATES.includes(state)
}

export function duration(startTime, endTime, state) {
  return endTime ? endTime : isFinished(state) ? startTime : null
}
