import { useLiveQuery } from "@tanstack/react-db"
import { itemsCollection } from "../db/collections"
import type { Item, Task, Status } from "../db/types"
import { generateId, nowISO, toDateStr } from "../lib/utils"

export function useItems(projectId: string | null) {
  // Subscribe to the full collection reactively
  const { data: allItems } = useLiveQuery(() =>
    projectId ? itemsCollection : null,
    [projectId]
  )

  // Filter and sort in JS
  const items: Item[] = (allItems ?? [])
    .filter((i) => i.projectId === projectId)
    .sort((a, b) => a.position - b.position)

  function getNextPosition(): number {
    // Use Date.now() for unique ordering even under rapid clicks
    return Date.now()
  }

  function addTask(description = "") {
    if (!projectId) return
    itemsCollection.insert({
      id: generateId(),
      projectId,
      type: "task",
      description,
      status: "TODO" as Status,
      estimation: null,
      timeSpent: null,
      createdAt: nowISO(),
      completedAt: null,
      notes: "",
      plannedStart: null,
      plannedEnd: null,
      position: getNextPosition(),
    } as Task)
  }

  function addTaskAfter(afterId: string) {
    if (!projectId) return
    const idx = items.findIndex((i) => i.id === afterId)
    const afterPos = idx >= 0 ? items[idx].position : Date.now()
    const nextPos = idx >= 0 && idx + 1 < items.length ? items[idx + 1].position : afterPos + 1000
    const newPos = afterPos + (nextPos - afterPos) / 2

    itemsCollection.insert({
      id: generateId(),
      projectId,
      type: "task",
      description: "",
      status: "TODO" as Status,
      estimation: null,
      timeSpent: null,
      createdAt: nowISO(),
      completedAt: null,
      notes: "",
      plannedStart: null,
      plannedEnd: null,
      position: newPos,
    } as Task)
  }

  function addSeparator(label = "New section") {
    if (!projectId) return
    itemsCollection.insert({
      id: generateId(),
      projectId,
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
      if ((status === "IN_QA" || status === "IN_PROD") && !t.completedAt) {
        t.completedAt = nowISO()
      }
      if (status === "IN_DEV" && !t.plannedStart) {
        const today = toDateStr(new Date())
        t.plannedStart = today
        if (!t.plannedEnd) t.plannedEnd = today
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
