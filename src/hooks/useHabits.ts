import { useState, useEffect } from "react"

const STORAGE_KEY = "backlogzy-habits"

export const HABIT_OPTIONS = [
  { emoji: "🧘‍♂️", label: "Méditation" },
  { emoji: "🏋️", label: "PPG" },
  { emoji: "📖", label: "Lecture" },
] as const

type HabitMap = Record<string, string[]> // "2026-04-01" → ["🧘‍♂️", "📖"]

export function useHabits() {
  const [habits, setHabits] = useState<HabitMap>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
  }, [habits])

  function toggleHabit(date: string, emoji: string) {
    setHabits((prev) => {
      const current = prev[date] ?? []
      const has = current.includes(emoji)
      const next = has ? current.filter((e) => e !== emoji) : [...current, emoji]
      if (next.length === 0) {
        const { [date]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [date]: next }
    })
  }

  function getHabits(date: string): string[] {
    return habits[date] ?? []
  }

  return { getHabits, toggleHabit }
}
