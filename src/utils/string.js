export function toPlural(word, count) {
  if (count == 1) {
    return word
  }

  const ending = ['s', 'sh', 'ch', 'x', 'z'].some(chars => word.endsWith(chars))
    ? 'es'
    : 's'

  return `${word}${ending}`
}
