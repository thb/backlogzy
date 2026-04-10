export const STATUSES = [
  "TODO",
  "IN_DESIGN",
  "IN_DEV",
  "IN_QA",
  "IN_PROD",
  "WAITING",
  "REDO",
] as const

export type Status = (typeof STATUSES)[number]

export const STATUS_CONFIG: Record<
  Status,
  { label: string; bg: string; text: string; dot: string }
> = {
  TODO: { label: "TODO", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-400" },
  IN_DESIGN: {
    label: "IN DESIGN",
    bg: "bg-purple-100",
    text: "text-purple-800",
    dot: "bg-purple-400",
  },
  IN_DEV: { label: "IN DEV", bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-400" },
  IN_QA: { label: "IN Q/A", bg: "bg-teal-100", text: "text-teal-800", dot: "bg-teal-400" },
  IN_PROD: { label: "IN PROD", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  WAITING: { label: "WAITING", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  REDO: { label: "REDO", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
}

export const PROJECT_COLORS = [
  { name: "gray", dot: "bg-gray-400", tab: "border-gray-300", pastel: "bg-gray-50" },
  { name: "red", dot: "bg-red-400", tab: "border-red-400", pastel: "bg-red-50" },
  { name: "orange", dot: "bg-orange-400", tab: "border-orange-400", pastel: "bg-orange-50" },
  { name: "yellow", dot: "bg-yellow-400", tab: "border-yellow-400", pastel: "bg-yellow-50" },
  { name: "green", dot: "bg-green-400", tab: "border-green-400", pastel: "bg-green-50" },
  { name: "teal", dot: "bg-teal-400", tab: "border-teal-400", pastel: "bg-teal-50" },
  { name: "blue", dot: "bg-blue-400", tab: "border-blue-400", pastel: "bg-blue-50" },
  { name: "purple", dot: "bg-purple-400", tab: "border-purple-400", pastel: "bg-purple-50" },
  { name: "pink", dot: "bg-pink-400", tab: "border-pink-400", pastel: "bg-pink-50" },
] as const

export type ProjectColor = (typeof PROJECT_COLORS)[number]["name"]

export type Project = {
  id: string
  name: string
  color: ProjectColor
  position: number
  created_at: string
}

export type Task = {
  id: string
  project_id: string
  type: "task"
  description: string
  status: Status
  estimation: number | null
  time_spent: number | null
  created_at: string
  completed_at: string | null
  notes: string
  planned_start: string | null // "2026-04-01" date-only
  planned_end: string | null   // "2026-04-03" date-only
  position: number
}

export type Separator = {
  id: string
  project_id: string
  type: "separator"
  label: string
  position: number
}

export type Item = Task | Separator
