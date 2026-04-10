import { useLiveQuery } from "@tanstack/react-db"
import { itemsCollection } from "../db/collections"
import type { Item, Task, Status } from "../db/types"
import { generateId, nowISO, toDateStr } from "../lib/utils"

export function useItems(project_id: string | null) {
  // Subscribe to the full collection reactively
  const { data: allItems } = useLiveQuery(() =>
    project_id ? itemsCollection : null,
    [project_id]
  )

  // Filter and sort in JS
  const items: Item[] = (allItems ?? [])
    .filter((i) => i.project_id === project_id)
    .sort((a, b) => a.position - b.position)

  function getNextPosition(): number {
    // Use Date.now() for unique ordering even under rapid clicks
    return Date.now()
  }

  function addTask(description = "") {
    if (!project_id) return
    itemsCollection.insert({
      id: generateId(),
      project_id,
      type: "task",
      description,
      status: "TODO" as Status,
      estimation: null,
      time_spent: null,
      created_at: nowISO(),
      completed_at: null,
      notes: "",
      planned_start: null,
      planned_end: null,
      position: getNextPosition(),
    } as Task)
  }

  function addTaskAfter(afterId: string) {
    if (!project_id) return
    const idx = items.findIndex((i) => i.id === afterId)
    const afterPos = idx >= 0 ? items[idx].position : Date.now()
    const nextPos = idx >= 0 && idx + 1 < items.length ? items[idx + 1].position : afterPos + 1000
    const newPos = afterPos + (nextPos - afterPos) / 2

    itemsCollection.insert({
      id: generateId(),
      project_id,
      type: "task",
      description: "",
      status: "TODO" as Status,
      estimation: null,
      time_spent: null,
      created_at: nowISO(),
      completed_at: null,
      notes: "",
      planned_start: null,
      planned_end: null,
      position: newPos,
    } as Task)
  }

  function addSeparator(label = "New section") {
    if (!project_id) return
    itemsCollection.insert({
      id: generateId(),
      project_id,
      type: "separator",
      label,
      position: getNextPosition(),
    })
  }

  function updateItem(id: string, changes: Partial<Item>) {
    itemsCollection.update(id, (draft) => {
      Object.assign(draft, changes)
    })
  }

  function updateTaskStatus(id: string, status: Status) {
    itemsCollection.update(id, (draft) => {
      const t = draft as Task
      t.status = status
      if ((status === "IN_QA" || status === "IN_PROD") && !t.completed_at) {
        t.completed_at = nowISO()
      }
      if (status === "IN_DEV" && !t.planned_start) {
        const today = toDateStr(new Date())
        t.planned_start = today
        if (!t.planned_end) t.planned_end = today
      }
    })
  }

  function deleteItem(id: string) {
    itemsCollection.delete(id)
  }

  function deleteAllItems() {
    items.forEach((i) => itemsCollection.delete(i.id))
  }

  function reorderItems(orderedIds: string[]) {
    orderedIds.forEach((id, index) => {
      itemsCollection.update(id, (draft) => {
        draft.position = index + 1
      })
    })
  }

  return {
    items,
    addTask,
    addTaskAfter,
    addSeparator,
    updateItem,
    updateTaskStatus,
    deleteItem,
    deleteAllItems,
    reorderItems,
  }
}
