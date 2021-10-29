import YAML from 'yaml'

export function formatYaml(value) {
  if (value == null) {
    return null
  }

  try {
    return YAML.stringify(value)
  } catch {
    return null
  }
}

export function tryParseYaml(value) {
  try {
    return parseYaml(value)
  } catch {
    return null
  }
}

export function parseYaml(value) {
  return YAML.parse(value)
}

export function isValidYaml(value) {
  try {
    parseYaml(value)
    return true
  } catch {
    return false
  }
}
