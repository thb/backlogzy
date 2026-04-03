type Props = {
  value: string | null
  onChange: (value: string | null) => void
}

export function EditableDateCell({ value, onChange }: Props) {
  // value is ISO string ("2026-04-03T...") or date string ("2026-04-03") or null
  const dateStr = value ? value.slice(0, 10) : ""

  return (
    <input
      type="date"
      value={dateStr}
      onChange={(e) => {
        const v = e.target.value
        onChange(v || null)
      }}
      className="w-full px-1.5 py-1 text-xs text-gray-500 bg-transparent border-none outline-none cursor-pointer h-[28px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative"
    />
  )
}
