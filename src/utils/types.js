export const types = [
  'null',
  'boolean',
  'number',
  'string',
  'object',
  'array',
  'date'
]

export function isValidType(type) {
  return types.includes(type)
}
