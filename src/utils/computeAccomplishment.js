/**
 * Converts a form value into a number suitable for the database.
 * Blank means "not reported" (null); a typed 0 means "reported zero" and is
 * preserved. Using `value || null` here would collapse both to null, which is
 * why a genuine zero used to disappear on the next save.
 * @param {number|string|null|undefined} value
 * @returns {number|null}
 */
export function toNullableNumber(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' && value.trim() === '') return null

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Converts a stored value back into a form input value.
 * Only null/undefined become blank — a stored 0 renders as "0" rather than an
 * empty field. `value || ''` would blank out the zero.
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
export function toInputValue(value) {
  if (value === null || value === undefined) return ''

  return String(value)
}

/**
 * Parses a value to a finite number, falling back to 0.
 * @param {number|string|null|undefined} value
 * @returns {number}
 */
export function toNumber(value) {
  const parsed = parseFloat(value)

  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Computes total accomplishment from three monthly values
 * Handles null/undefined/empty as 0
 * @param {number|string|null|undefined} m1 - Month 1 value
 * @param {number|string|null|undefined} m2 - Month 2 value
 * @param {number|string|null|undefined} m3 - Month 3 value
 * @returns {number} - Sum of the three months
 */
export function computeTotal(m1, m2, m3) {
  return toNumber(m1) + toNumber(m2) + toNumber(m3)
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

  if (!Number.isFinite(targetNum) || targetNum === 0) {
    return null
  }

  return (total / targetNum) * 100
}

/**
 * Clamps a percentage into the range a gauge arc can actually draw.
 * A doughnut fed [120, -20] renders a broken, wrapping arc, so the arc value
 * is clamped while callers keep the true figure for the label.
 * @param {number|null|undefined} percentage
 * @param {number} max - Upper bound, default 100
 * @returns {number}
 */
export function clampPercentage(percentage, max = 100) {
  const parsed = toNumber(percentage)

  return Math.min(Math.max(parsed, 0), max)
}
