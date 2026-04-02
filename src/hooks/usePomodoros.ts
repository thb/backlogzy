import { useState, useEffect } from "react"

const STORAGE_KEY = "backlogzy-pomodoros"

type PomodoroMap = Record<string, number> // "2026-04-01" → count

export function usePomodoros() {
  const [pomodoros, setPomodoros] = useState<PomodoroMap>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pomodoros))
  }, [pomodoros])

  function addPomodoro(date: string) {
    setPomodoros((prev) => ({ ...prev, [date]: (prev[date] ?? 0) + 1 }))
  }

  function removePomodoro(date: string) {
    setPomodoros((prev) => {
      const count = (prev[date] ?? 0) - 1
      if (count <= 0) {
        const { [date]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [date]: count }
    })
  }

  function getCount(date: string): number {
    return pomodoros[date] ?? 0
  }

  return { getCount, addPomodoro, removePomodoro }
}
