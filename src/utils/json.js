import jsBeautify from 'js-beautify'

export function formatJson(value) {
  if (value == null) {
    return null
  }

  try {
    return jsBeautify(JSON.stringify(value), {
      indent_size: 2,
      space_in_empty_paren: true,
      preserve_newlines: false
    })
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

export function getJsonErrors(value) {
  if (value == null || value == '') {
    return []
  }

  try {
    JSON.parse(value)
    return []
  } catch (e) {
    return [e.toString()]
  }
}

export function isValidJson(value) {
  return getJsonErrors(value).length === 0
}
