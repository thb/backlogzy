import { useState, useRef, useEffect } from "react"

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function EditableCell({
  value,
  onChange,
  placeholder = "",
  className = "",
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  function commit() {
    setEditing(false)
    if (draft !== value) {
      onChange(draft)
    }
  }

  return (
    <input
      ref={inputRef}
      value={editing ? draft : value}
      readOnly={!editing}
      onClick={() => !editing && setEditing(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit()
        if (e.key === "Escape") {
          setDraft(value)
          setEditing(false)
        }
      }}
      placeholder={placeholder}
      className={`w-full bg-transparent outline-none px-2 py-1 h-[28px] cursor-text ${editing ? "" : "truncate"} ${className}`}
    />
  )
}
