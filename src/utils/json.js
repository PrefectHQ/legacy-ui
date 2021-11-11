import jsBeautify from 'js-beautify'

export function tryFormatJson(value) {
  if (value == null || typeof value !== 'object') {
    return value
  }

  try {
    return formatJson(value)
  } catch {
    return null
  }
}

export function tryFormatSingleLineJson(value) {
  if (value == null || typeof value !== 'object') {
    return value
  }

  try {
    return formatSingleLineJson(value)
  } catch {
    return null
  }
}

export function formatJson(value) {
  return jsBeautify(JSON.stringify(value), {
    indent_size: 2,
    space_in_empty_paren: true,
    preserve_newlines: false
  })
}

export function formatSingleLineJson(value) {
  const formatted = jsBeautify(JSON.stringify(value), {
    indent_size: 0,
    space_in_empty_paren: true,
    preserve_newlines: false
  })

  return formatted.replace(/\n/g, ' ')
}

export function tryParseJson(value) {
  try {
    return parseJson(value)
  } catch {
    return null
  }
}

export function parseJson(value) {
  return JSON.parse(value)
}

export function isValidJson(value) {
  try {
    parseJson(value)
    return true
  } catch {
    return false
  }
}
