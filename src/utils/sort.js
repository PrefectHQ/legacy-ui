export function alphabeticallyByKey(a, b, key) {
  return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0
}
