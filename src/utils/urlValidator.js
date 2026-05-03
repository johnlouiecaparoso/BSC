/**
 * Validates if a string is a valid URL starting with http:// or https://
 * @param {string} value - The URL string to validate
 * @returns {boolean} - True if valid URL, false otherwise
 */
export function isValidURL(value) {
  if (!value || typeof value !== 'string') {
    return false
  }

  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return false
  }

  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
}
