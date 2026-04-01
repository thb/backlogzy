import { useLiveQuery } from "@tanstack/react-db"
import { itemsCollection } from "../db/collections"
import type { Task } from "../db/types"

export function useAllTasks() {
  const { data } = useLiveQuery(() => itemsCollection)
  return ((data ?? []) as any[]).filter(
    (i) => i.type === "task"
  ) as Task[]
}
