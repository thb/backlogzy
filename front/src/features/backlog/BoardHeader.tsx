import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { PROJECT_COLORS, type Project } from "./types";
import { useUpdateProject } from "./projectHooks";
import { ColorPicker } from "./ColorPicker";
import { ConfirmDialog } from "./ConfirmDialog";

// Current-board toolbar: inline rename, color picker, delete. Navigation lives
// in the sidebar; deletion is owned by the page (it must fix the URL too).
export function BoardHeader({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(project.name);
  const [pickingColor, setPickingColor] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateProject = useUpdateProject();

  const dot = PROJECT_COLORS.find((c) => c.name === project.color)?.dot ?? "bg-gray-400";

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commitRename() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== project.name) {
      updateProject.mutate({ id: project.id, changes: { name: trimmed } });
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickingColor(!pickingColor)}
          className={`h-3 w-3 rounded-full ${dot} cursor-pointer hover:scale-110 transition-transform`}
          title="Change color"
        />
        {pickingColor && (
          <ColorPicker
            current={project.color}
            onChange={(color) => updateProject.mutate({ id: project.id, changes: { color } })}
            onClose={() => setPickingColor(false)}
          />
        )}
      </div>

      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setEditing(false);
          }}
          className="rounded border border-gray-200 px-2 py-0.5 text-sm font-medium outline-none focus:border-gray-300"
        />
      ) : (
        <button
          type="button"
          onDoubleClick={() => {
            setValue(project.name);
            setEditing(true);
          }}
          onClick={() => {
            setValue(project.name);
            setEditing(true);
          }}
          className="cursor-text text-sm font-medium text-gray-900"
          title="Rename"
        >
          {project.name}
        </button>
      )}

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
        title="Delete board"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {confirming && (
        <ConfirmDialog
          title="Delete board?"
          message={`"${project.name}" and all its items will be permanently deleted.`}
          onConfirm={() => {
            setConfirming(false);
            onDelete(project.id);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
