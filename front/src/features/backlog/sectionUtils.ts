import { arrayMove } from "@dnd-kit/sortable";
import type { Item } from "./types";

// A task belongs to the section opened by the closest separator above it —
// membership is derived from row order, there is no explicit link. Collapsing
// is therefore pure view state: hide the rows until the next separator.

export function visibleItems(items: Item[], collapsed: Set<string>): Item[] {
  const out: Item[] = [];
  let hiding = false;
  for (const item of items) {
    if (item.kind === "separator") {
      hiding = collapsed.has(item.id);
      out.push(item);
    } else if (!hiding) {
      out.push(item);
    }
  }
  return out;
}

export function sectionCounts(items: Item[]): Map<string, number> {
  const counts = new Map<string, number>();
  let current: string | null = null;
  for (const item of items) {
    if (item.kind === "separator") {
      current = item.id;
      counts.set(item.id, 0);
    } else if (current) {
      counts.set(current, (counts.get(current) ?? 0) + 1);
    }
  }
  return counts;
}

// Reorder over the VISIBLE rows, then re-attach the hidden children of each
// collapsed section right behind their separator — dragging a collapsed
// section moves its whole block. Returns the full ordered id list.
export function reorderWithHidden(
  items: Item[],
  collapsed: Set<string>,
  activeId: string,
  overId: string,
): string[] {
  const visible = visibleItems(items, collapsed);
  const from = visible.findIndex((i) => i.id === activeId);
  const to = visible.findIndex((i) => i.id === overId);
  if (from === -1 || to === -1) return items.map((i) => i.id);

  const hidden = new Map<string, string[]>();
  let current: string | null = null;
  for (const item of items) {
    if (item.kind === "separator") {
      current = collapsed.has(item.id) ? item.id : null;
    } else if (current) {
      hidden.set(current, [...(hidden.get(current) ?? []), item.id]);
    }
  }

  const out: string[] = [];
  for (const item of arrayMove(visible, from, to)) {
    out.push(item.id);
    if (item.kind === "separator") out.push(...(hidden.get(item.id) ?? []));
  }
  return out;
}
