import { STATUSES, STATUS_CONFIG, type Status } from "../db/types"

type Props = {
  value: Status
  onChange: (status: Status) => void
}

export function StatusSelect({ value, onChange }: Props) {
  const config = STATUS_CONFIG[value]

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`${config.bg} ${config.text} rounded-sm px-1.5 py-0.5 text-xs font-medium border-0 outline-none cursor-pointer appearance-none text-center w-full`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_CONFIG[s].label}
        </option>
      ))}
    </select>
  )
}
