import { useLiveQuery } from "@tanstack/react-db"
import { projectsCollection } from "../db/collections"
import type { Project, ProjectColor } from "../db/types"
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
      color: "gray" as ProjectColor,
      position: maxPos + 1,
      created_at: nowISO(),
    })
  }

  function renameProject(id: string, name: string) {
    projectsCollection.update(id, (draft) => {
      draft.name = name
    })
  }

  function setProjectColor(id: string, color: ProjectColor) {
    projectsCollection.update(id, (draft) => {
      draft.color = color
    })
  }

  function reorderProjects(orderedIds: string[]) {
    orderedIds.forEach((id, index) => {
      projectsCollection.update(id, (draft) => {
        draft.position = index + 1
      })
    })
  }

  function deleteProject(id: string) {
    projectsCollection.delete(id)
  }

  return {
    projects,
    addProject,
    renameProject,
    setProjectColor,
    reorderProjects,
    deleteProject,
  }
}
