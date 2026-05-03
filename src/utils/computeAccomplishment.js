/**
 * Computes total accomplishment from three monthly values
 * Handles null/undefined/empty as 0
 * @param {number|string|null|undefined} m1 - Month 1 value
 * @param {number|string|null|undefined} m2 - Month 2 value
 * @param {number|string|null|undefined} m3 - Month 3 value
 * @returns {number} - Sum of the three months
 */
export function computeTotal(m1, m2, m3) {
  const val1 = parseFloat(m1) || 0
  const val2 = parseFloat(m2) || 0
  const val3 = parseFloat(m3) || 0

  return val1 + val2 + val3
}

/**
 * Computes percentage of total vs target
 * Returns null if target is 0 or empty to avoid division by zero
 * @param {number} total - Total accomplishment value
 * @param {number|string|null|undefined} target - Target value
 * @returns {number|null} - Percentage value or null
 */
export function computePercentage(total, target) {
  const targetNum = parseFloat(target)

  if (!targetNum || targetNum === 0) {
    return null
  }

  return (total / targetNum) * 100
}
