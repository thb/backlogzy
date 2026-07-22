import { useState } from "react";

const STORAGE_KEY = "backlogzy-collapsed-sections";

// Device-level view preference (like column widths) — not bookmarkable state.
export function useCollapsedSections() {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
    } catch {
      return new Set();
    }
  });

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  return { collapsed, toggle };
}
