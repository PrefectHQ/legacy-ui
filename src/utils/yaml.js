import YAML from 'yaml'

export function formatYaml(value) {
  if (!value) {
    return null
  }

  try {
    if (typeof value == 'string') {
      value = YAML.parse(value)
    }
    return YAML.stringify(value)
  } catch {
    return null
  }
}

export function parseYaml(value) {
  try {
    return YAML.parse(value)
  } catch {
    return null
  }
}

export function getYamlErrors(value) {
  if (!value) {
    return []
  }

  try {
    YAML.parse(value)
    return []
  } catch (e) {
    return [e.toString().trim()]
  }
}

export function isValidYaml(value) {
  return getYamlErrors(value).length === 0
}
