export const types = [
  'None',
  'Boolean',
  'Integer',
  'String',
  'Dictionary',
  'List',
  'Date'
]

export function isValidType(type) {
  return types.includes(type)
}
