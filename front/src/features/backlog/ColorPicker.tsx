import { useRef, useEffect } from "react";
import { PROJECT_COLORS, type ProjectColor } from "./types";

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
