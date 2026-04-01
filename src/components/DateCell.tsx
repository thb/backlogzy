import { formatDate } from "../lib/utils"

type Props = {
  value: string | null
}

export function DateCell({ value }: Props) {
  if (!value) {
    return (
      <div className="px-2 py-1 text-center text-gray-300 text-sm">-</div>
    )
  }
  return (
    <div className="px-2 py-1 text-center text-gray-500 text-sm">
      {formatDate(value)}
    </div>
  )
}
