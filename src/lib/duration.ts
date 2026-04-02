export const MINUTES_PER_HOUR = 60
export const MINUTES_PER_DAY = 420 // 7h

/**
 * Parse a duration string into minutes.
 * Supported formats: "10m", "2h", "1h30", "1h30m", "1j", "0.5j", bare number (treated as hours)
 */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase()
  if (!s) return null

  // "1j", "0.5j", "1.5j"
  const dayMatch = s.match(/^(\d+(?:[.,]\d+)?)\s*j$/)
  if (dayMatch) {
    const days = parseFloat(dayMatch[1].replace(",", "."))
    return Math.round(days * MINUTES_PER_DAY)
  }

  // "1h30m", "1h30", "2h"
  const hmMatch = s.match(/^(\d+)\s*h\s*(?:(\d+)\s*m?)?$/)
  if (hmMatch) {
    const hours = parseInt(hmMatch[1])
    const mins = hmMatch[2] ? parseInt(hmMatch[2]) : 0
    return hours * MINUTES_PER_HOUR + mins
  }

  // "30m", "10m"
  const minMatch = s.match(/^(\d+)\s*m$/)
  if (minMatch) {
    return parseInt(minMatch[1])
  }

  // Bare number → hours (backward compat)
  const num = parseFloat(s.replace(",", "."))
  if (!isNaN(num)) {
    return Math.round(num * MINUTES_PER_HOUR)
  }

  return null
}

/**
 * Format minutes into a smart human-readable string.
 * < 60m → "30m"
 * 60..419m → "2h" or "1h30"
 * >= 420m → "1j" or "1.5j"
 */
export function formatDuration(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) {
    return `${Math.round(minutes)}m`
  }

  if (minutes < MINUTES_PER_DAY) {
    const h = Math.floor(minutes / MINUTES_PER_HOUR)
    const m = Math.round(minutes % MINUTES_PER_HOUR)
    return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`
  }

  const days = minutes / MINUTES_PER_DAY
  // Round to nearest 0.5
  const rounded = Math.round(days * 2) / 2
  if (rounded === Math.floor(rounded)) {
    return `${rounded}j`
  }
  return `${rounded}j`
}
