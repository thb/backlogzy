import { useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PROJECT_COLORS, type Project, type ProjectColor } from "./types";

export function ColorPicker({
  current,
  onChange,
  onClose,
}: {
  current: ProjectColor;
  onChange: (c: ProjectColor) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-1.5 flex gap-1 z-50"
    >
      {PROJECT_COLORS.map((c) => (
        <button
          key={c.name}
          onClick={(e) => {
            e.stopPropagation();
            onChange(c.name);
            onClose();
          }}
          className={`w-5 h-5 rounded-full ${c.dot} cursor-pointer ${c.name === current ? "ring-2 ring-offset-1 ring-gray-400" : "hover:scale-110"} transition-transform`}
        />
      ))}
    </div>
  );
}

export function SortableTab({
  project,
  isActive,
  isEditing,
  editValue,
  inputRef,
  onSelect,
  onStartRename,
  onEditChange,
  onCommitRename,
  onCancelRename,
  onDelete,
  onColorClick,
}: {
  project: Project;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
  onStartRename: () => void;
  onEditChange: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
  onColorClick: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const colorCfg = PROJECT_COLORS.find((c) => c.name === project.color) ?? PROJECT_COLORS[0];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-sm cursor-pointer select-none ${
        isActive
          ? `border-gray-200 bg-white text-gray-900 font-medium border-t-2 ${colorCfg.tab}`
          : "border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
      onClick={() => !isEditing && onSelect()}
      onDoubleClick={onStartRename}
      {...attributes}
      {...listeners}
    >
      {/* Color dot */}
      <button
        onClick={onColorClick}
        className={`shrink-0 w-2.5 h-2.5 rounded-full ${colorCfg.dot} hover:scale-125 transition-transform cursor-pointer`}
        title="Change color"
      />

      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitRename();
            if (e.key === "Escape") onCancelRename();
          }}
          className="w-24 bg-transparent outline-none text-sm"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="truncate">{project.name}</span>
          {isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="ml-0.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs cursor-pointer"
              title="Delete project"
            >
              &times;
            </button>
          )}
        </>
      )}
    </div>
  );
}
