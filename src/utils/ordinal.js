export const ordinal = n => {
  n = parseInt(n)
  return (
    ['st', 'nd', 'rd'][(((((n < 0 ? -n : n) + 90) % 100) - 10) % 10) - 1] ||
    'th'
  )
}
