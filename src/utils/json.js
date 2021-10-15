export function formatJson(value, tabSpaces = 2) {
  if (!value) {
    return null
  }

  try {
    if (typeof value == 'string') {
      value = JSON.parse(value)
    }
    return JSON.stringify(value, null, tabSpaces)
  } catch {
    return null
  }
}

export function parseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function isValidJson(value) {
  if (!value) {
    return null
  }

  try {
    JSON.parse(value)
    return true
  } catch (e) {
    return false
  }
}
