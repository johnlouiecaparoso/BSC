export const QUARTERS = ['q1', 'q2', 'q3', 'q4']

export const QUARTER_OPTIONS = [
  { value: 'q1', label: 'Q1' },
  { value: 'q2', label: 'Q2' },
  { value: 'q3', label: 'Q3' },
  { value: 'q4', label: 'Q4' }
]

/**
 * Returns true when the value is one of the four supported quarter keys.
 * @param {string} quarter
 * @returns {boolean}
 */
export function isValidQuarter(quarter) {
  return QUARTERS.includes(quarter)
}

/**
 * Returns the quarter the given date falls in.
 * @param {Date} [date] - Defaults to now
 * @returns {string} - q1, q2, q3 or q4
 */
export function getCurrentQuarter(date = new Date()) {
  return QUARTERS[Math.floor(date.getMonth() / 3)]
}

/**
 * Returns the current reporting year.
 * @param {Date} [date] - Defaults to now
 * @returns {number}
 */
export function getCurrentYear(date = new Date()) {
  return date.getFullYear()
}

/**
 * Returns a descending list of selectable reporting years.
 * Starts at 2026 (the first cycle the system tracked) and always includes the
 * current year plus one ahead, so planning next year's targets is possible.
 * @param {number} [current] - Defaults to the current year
 * @returns {number[]}
 */
export function getSelectableYears(current = getCurrentYear()) {
  const first = 2026
  const last = Math.max(current + 1, first)
  const years = []

  for (let year = last; year >= first; year--) {
    years.push(year)
  }

  return years
}

/**
 * Zero-based index of the first month of a quarter (q1 -> 0, q2 -> 3, ...).
 * Returns null for an unrecognised quarter so callers can skip the record
 * rather than writing into a wrong or out-of-range month bucket.
 * @param {string} quarter
 * @returns {number|null}
 */
export function getQuarterStartMonth(quarter) {
  const index = QUARTERS.indexOf(quarter)

  return index === -1 ? null : index * 3
}

/**
 * Returns month labels for a given quarter
 * @param {string} quarter - Quarter identifier (q1, q2, q3, q4)
 * @returns {string[]} - Array of month names
 */
export function getMonthLabels(quarter) {
  const quarterMap = {
    q1: ['January', 'February', 'March'],
    q2: ['April', 'May', 'June'],
    q3: ['July', 'August', 'September'],
    q4: ['October', 'November', 'December']
  }

  return quarterMap[quarter] || []
}

/**
 * Returns formatted quarter label
 * @param {string} quarter - Quarter identifier (q1, q2, q3, q4)
 * @returns {string} - Formatted quarter label
 */
export function getQuarterLabel(quarter) {
  const labelMap = {
    q1: 'Q1 — Jan to Mar',
    q2: 'Q2 — Apr to Jun',
    q3: 'Q3 — Jul to Sep',
    q4: 'Q4 — Oct to Dec'
  }

  return labelMap[quarter] || (quarter ? String(quarter).toUpperCase() : '')
}

/**
 * Returns short month labels for a given quarter
 * @param {string} quarter - Quarter identifier (q1, q2, q3, q4)
 * @returns {string[]} - Array of short month names
 */
export function getShortMonthLabels(quarter) {
  const quarterMap = {
    q1: ['Jan', 'Feb', 'Mar'],
    q2: ['Apr', 'May', 'Jun'],
    q3: ['Jul', 'Aug', 'Sep'],
    q4: ['Oct', 'Nov', 'Dec']
  }

  return quarterMap[quarter] || []
}
