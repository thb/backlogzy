import { useLiveQuery } from "@tanstack/react-db"
import { projectsCollection } from "../db/collections"
import type { Project } from "../db/types"
import { generateId, nowISO } from "../lib/utils"

export function useProjects() {
  const { data: rawProjects } = useLiveQuery(() => projectsCollection)

  const projects: Project[] = (rawProjects ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)

  function addProject(name: string) {
    const maxPos =
      projects.length > 0
        ? Math.max(...projects.map((p) => p.position))
        : 0
    projectsCollection.insert({
      id: generateId(),
      name,
      position: maxPos + 1,
      createdAt: nowISO(),
    })
  }

  function renameProject(id: string, name: string) {
    projectsCollection.update(id, (draft) => {
      draft.name = name
    })
  }

  function deleteProject(id: string) {
    projectsCollection.delete(id)
  }

  return { projects, addProject, renameProject, deleteProject }
}
