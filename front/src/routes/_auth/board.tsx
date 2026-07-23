import { createFileRoute } from "@tanstack/react-router";
import { BoardPage } from "@/features/backlog/BoardPage";

interface BoardSearch {
  project?: string;
  detail?: string;
  archived?: boolean; // show archived items too
}

export const Route = createFileRoute("/_auth/board")({
  validateSearch: (search: Record<string, unknown>): BoardSearch => ({
    project: typeof search.project === "string" ? search.project : undefined,
    detail: typeof search.detail === "string" ? search.detail : undefined,
    archived: search.archived === true || search.archived === "true" ? true : undefined,
  }),
  component: BoardPage,
});
