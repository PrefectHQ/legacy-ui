import { parseJson, formatJson } from '@/utils/json'

// fisher yates shuffle
export function shuffle(inputArray) {
  // Copy array so as not to mutate
  let array = [...inputArray]
  let currentIndex = array.length,
    temporaryValue,
    randomIndex

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

export function convertValueToArray(value) {
  if (value == null) {
    return []
  }

  if (typeof value === 'string') {
    const objectOrArrayOrNull = parseJson(value)
    return convertValueToArray(objectOrArrayOrNull)
  }

  if (Array.isArray(value)) {
    return value
  }

  return Object.entries(value).map(([key, value]) => ({
    key,
    value
  }))
}

export function convertArrayToTargetType(array, target) {
  if (typeof target === 'string') {
    return formatJson(array)
  }

  if (Array.isArray(target)) {
    return array
  }

  return array.reduce(
    (obj, entry) => ({ ...obj, [entry.key]: entry.value }),
    {}
  )
}
