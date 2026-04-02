import { useState, useRef, useEffect } from "react"
import { parseDuration, formatDuration } from "../lib/duration"

type Props = {
  value: number | null // minutes
  onChange: (value: number | null) => void
}

export function HoursCell({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value != null ? formatDuration(value) : "")
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function commit() {
    setEditing(false)
    onChange(parseDuration(draft))
  }

  if (!editing) {
    return (
      <div
        className="cursor-text px-2 py-1 text-center text-gray-600 min-h-[28px]"
        onClick={() => setEditing(true)}
      >
        {value != null ? formatDuration(value) : <span className="text-gray-300">-</span>}
      </div>
    )
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit()
        if (e.key === "Escape") {
          setDraft(value != null ? formatDuration(value) : "")
          setEditing(false)
        }
      }}
      placeholder="2h, 30m, 1j"
      className="w-full bg-transparent outline-none px-2 py-1 text-center text-sm"
    />
  )
}
