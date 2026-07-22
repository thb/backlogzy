import { nowISO, toDateStr } from "@/lib/dates";
import type { Item, Status } from "./types";
import type { ItemChanges } from "./itemHooks";

// Side-effects of a status transition, shared by the board and planning views:
// moving to QA/PROD stamps completion, starting dev plans the task for today.
export function statusChangePatch(item: Item, status: Status): ItemChanges {
  const changes: ItemChanges = { status };
  if ((status === "IN_QA" || status === "IN_PROD") && !item.completed_at) {
    changes.completed_at = nowISO();
  }
  if (status === "IN_DEV" && !item.planned_start) {
    const today = toDateStr(new Date());
    changes.planned_start = today;
    if (!item.planned_end) changes.planned_end = today;
  }
  return changes;
}
