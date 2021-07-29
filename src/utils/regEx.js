const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const PARSED_SCHEDULE_REGEX = /([0-9]{1,2}:?[0-9]{0,2})|(?:am|pm|days|day|years|year|weeks|week|hours|hour|minutes|minute|seconds|second|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)/gim

// These work in most cases but don't protect against double dashes or slashes
// e.g. 5/6/7 or 5-6-7
// It gives us a pretty reasonable approximation of a valid string though.

// [1-5]?[0-9]
// Tests: https://regex101.com/r/e588QW/1
const CRON_MINUTE_REGEX = /(^\*{1})$|(^[1-5]?[0-9](?:[,-/][1-5]?[0-9])*$)/i

// 2[0-3]|1[0-9]|[0-9]
// Tests: https://regex101.com/r/5cbtnj/1
const CRON_HOUR_REGEX = /^(^\*{1})$|(^(2[0-3]|1[0-9]|[0-9])(?:[,-/](2[0-3]|1[0-9]|[0-9]))*$)/i

// 3[01]|[12][0-9]|[1-9]
// Tests: https://regex101.com/r/y1auyB/1
const CRON_DAY_MONTH_REGEX = /^(\*{1})$|(^(3[01]|[12][0-9]|[1-9])(?:[,-/](3[01]|[12][0-9]|[1-9]))*$)/i

// 1[0-2]|[1-9]
// Tests: https://regex101.com/r/dPw34Y/1
const CRON_MONTH_REGEX = /^(\*{1})$|(^(1[0-2]|[1-9])(?:[,-/](1[0-2]|[1-9]))*$)|(^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:[,-/](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))*$)/i

// [0-6]
// Tests: https://regex101.com/r/G4cbea/1
const CRON_DAY_WEEK_REGEX = /^(\*{1})$|(^([0-6])(?:[,-/#]([0-6]))*$)|(^(sun|mon|tue|wed|thu|fri|sat)(?:[,-/#](sun|mon|tue|wed|thu|fri|sat))*$)/i

export {
  EMAIL_REGEX,
  PARSED_SCHEDULE_REGEX,
  CRON_MINUTE_REGEX,
  CRON_HOUR_REGEX,
  CRON_DAY_MONTH_REGEX,
  CRON_MONTH_REGEX,
  CRON_DAY_WEEK_REGEX
}
