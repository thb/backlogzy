import { Link } from "@tanstack/react-router";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PROJECT_COLORS, type Project } from "./types";

const ROW = "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900";
const ROW_ACTIVE = "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm bg-gray-100 font-medium text-gray-900";

export function SidebarProjectRow({ project, isActive }: { project: Project; isActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });
  const dot = PROJECT_COLORS.find((c) => c.name === project.color)?.dot ?? "bg-gray-400";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
      {...listeners}
    >
      <Link to="/board" search={{ project: project.id }} className={isActive ? ROW_ACTIVE : ROW}>
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />
        <span className="truncate">{project.name}</span>
      </Link>
    </li>
  );
}
