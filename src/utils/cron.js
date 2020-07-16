export const months = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
  get JAN() {
    return this[1]
  },
  get FEB() {
    return this[2]
  },
  get MAR() {
    return this[3]
  },
  get APR() {
    return this[4]
  },
  get MAY() {
    return this[5]
  },
  get JUN() {
    return this[6]
  },
  get JUL() {
    return this[7]
  },
  get AUG() {
    return this[8]
  },
  get SEP() {
    return this[9]
  },
  get OCT() {
    return this[10]
  },
  get NOV() {
    return this[11]
  },
  get DEC() {
    return this[12]
  }
}

export const daysWeek = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  get SUN() {
    return this[0]
  },
  get MON() {
    return this[1]
  },
  get TUE() {
    return this[2]
  },
  get WED() {
    return this[3]
  },
  get THU() {
    return this[4]
  },
  get FRI() {
    return this[5]
  },
  get SAT() {
    return this[6]
  }
}

export const common = {
  '* * * * *': 'every minute',
  '* * * * * *': 'every minute',
  '0 * * * *': 'every hour',
  '0 * * * * *': 'every hour',
  '0 0 * * * *': 'every day at 12:00 AM',
  '0 0 * * *': 'every day at 12:00 AM',
  '0 0 1 * *': '12:00 AM on the 1st day of every month',
  '0 0 1 * * *': '12:00 AM on the 1st day of every month'
}

// Returns nothing, a comma, or 'and'
// depending on a list and the position of the
// element in the list
export const oxfordList = (list, i) => {
  const required = list.length > 2
  const isTwoElements = list.length == 2
  const isLast = i + 1 == list.length
  const isSecondToLast = i + 2 == list.length

  if (required && !isLast && !isSecondToLast) {
    return ', '
  }

  if (required && isSecondToLast) {
    return ', and '
  }

  if (isTwoElements && i === 0) {
    return ' and '
  }

  return ''
}
