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
  { label: string; bg: string; text: string }
> = {
  TODO: { label: "TODO", bg: "bg-yellow-100", text: "text-yellow-800" },
  IN_DESIGN: {
    label: "IN DESIGN",
    bg: "bg-purple-100",
    text: "text-purple-800",
  },
  IN_DEV: { label: "IN DEV", bg: "bg-blue-100", text: "text-blue-800" },
  IN_QA: { label: "IN Q/A", bg: "bg-teal-100", text: "text-teal-800" },
  IN_PROD: { label: "IN PROD", bg: "bg-green-100", text: "text-green-800" },
  WAITING: { label: "WAITING", bg: "bg-gray-100", text: "text-gray-600" },
  REDO: { label: "REDO", bg: "bg-red-100", text: "text-red-800" },
}

export type Project = {
  id: string
  name: string
  position: number
  createdAt: string
}

export type Task = {
  id: string
  projectId: string
  type: "task"
  description: string
  status: Status
  estimation: number | null
  timeSpent: number | null
  createdAt: string
  completedAt: string | null
  notes: string
  position: number
}

export type Separator = {
  id: string
  projectId: string
  type: "separator"
  label: string
  position: number
}

export type Item = Task | Separator
