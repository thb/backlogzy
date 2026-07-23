import { createFileRoute } from "@tanstack/react-router";
import { PlanningPage } from "@/features/planning/PlanningPage";

interface PlanningSearch {
  start?: string; // "2026-04-06" — first visible day (defaults to this week's Monday)
  detail?: string;
  hide_empty?: boolean; // hide projects with nothing planned in the visible week
}

export const Route = createFileRoute("/_auth/planning")({
  validateSearch: (search: Record<string, unknown>): PlanningSearch => ({
    start: typeof search.start === "string" ? search.start : undefined,
    detail: typeof search.detail === "string" ? search.detail : undefined,
    hide_empty: search.hide_empty === true || search.hide_empty === "true" ? true : undefined,
  }),
  component: PlanningPage,
});
