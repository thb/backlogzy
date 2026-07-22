import { useState, useEffect } from "react";
import type { ColumnSizingState } from "@tanstack/react-table";

// Column widths are a per-device UI preference, not bookmarkable state → localStorage.
export function useColumnSizing(key: string) {
  const storageKey = `backlogzy-colsizing-${key}`;

  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as ColumnSizingState) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(columnSizing));
  }, [columnSizing, storageKey]);

  return { columnSizing, setColumnSizing };
}
