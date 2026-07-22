import { createFileRoute } from "@tanstack/react-router";
import { BoardPage } from "@/features/backlog/BoardPage";

interface BoardSearch {
  project?: string;
  detail?: string;
}

export const Route = createFileRoute("/_auth/board")({
  validateSearch: (search: Record<string, unknown>): BoardSearch => ({
    project: typeof search.project === "string" ? search.project : undefined,
    detail: typeof search.detail === "string" ? search.detail : undefined,
  }),
  component: BoardPage,
});
