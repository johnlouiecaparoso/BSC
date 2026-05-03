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

  return labelMap[quarter] || quarter.toUpperCase()
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
