import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db"
import type { Project, Item } from "./types"

export const projectsCollection = createCollection(
  localStorageCollectionOptions<Project>({
    id: "projects",
    storageKey: "backlogzy-projects",
    getKey: (item) => item.id,
  })
)

export const itemsCollection = createCollection(
  localStorageCollectionOptions<Item>({
    id: "items",
    storageKey: "backlogzy-items",
    getKey: (item) => item.id,
  })
)
