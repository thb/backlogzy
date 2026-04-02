const MIGRATION_KEY = "backlogzy-migrations"

function getApplied(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(MIGRATION_KEY) ?? "[]"))
  } catch {
    return new Set()
  }
}

function markApplied(name: string) {
  const applied = getApplied()
  applied.add(name)
  localStorage.setItem(MIGRATION_KEY, JSON.stringify([...applied]))
}

/**
 * Migrate estimation/timeSpent from hours to minutes.
 * Old format: 2 = 2 hours. New format: 120 = 120 minutes.
 */
function migrateHoursToMinutes() {
  const name = "hours-to-minutes-v1"
  if (getApplied().has(name)) return

  const raw = localStorage.getItem("backlogzy-items")
  if (!raw) {
    markApplied(name)
    return
  }

  try {
    const data = JSON.parse(raw)
    let changed = false
    for (const key of Object.keys(data)) {
      const item = data[key]?.data
      if (!item || item.type !== "task") continue

      if (item.estimation != null && item.estimation > 0) {
        // Values <= 100 are likely hours (nobody has 100+ hours estimates)
        // Values > 100 are likely already minutes (from new format)
        if (item.estimation <= 100) {
          item.estimation = Math.round(item.estimation * 60)
          changed = true
        }
      }
      if (item.timeSpent != null && item.timeSpent > 0) {
        if (item.timeSpent <= 100) {
          item.timeSpent = Math.round(item.timeSpent * 60)
          changed = true
        }
      }
    }
    if (changed) {
      localStorage.setItem("backlogzy-items", JSON.stringify(data))
    }
  } catch {
    // Skip migration on parse error
  }

  markApplied(name)
}

/** Run all pending migrations. Call before React renders. */
export function runMigrations() {
  migrateHoursToMinutes()
}
