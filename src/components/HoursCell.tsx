import { useState, useRef, useEffect } from "react"

type Props = {
  value: number | null
  onChange: (value: number | null) => void
}

export function HoursCell({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value?.toString() ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value?.toString() ?? "")
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function commit() {
    setEditing(false)
    const num = parseFloat(draft)
    onChange(isNaN(num) ? null : num)
  }

  if (!editing) {
    return (
      <div
        className="cursor-text px-2 py-1 text-center text-gray-600 min-h-[28px]"
        onClick={() => setEditing(true)}
      >
        {value != null ? `${value}h` : <span className="text-gray-300">-</span>}
      </div>
    )
  }

  return (
    <input
      ref={inputRef}
      type="number"
      step="0.5"
      min="0"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit()
        if (e.key === "Escape") {
          setDraft(value?.toString() ?? "")
          setEditing(false)
        }
      }}
      className="w-full bg-transparent outline-none px-2 py-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}
