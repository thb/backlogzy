import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Mode = "write" | "preview";

const TAB = "px-2.5 py-1 text-xs rounded-md cursor-pointer text-gray-400 hover:text-gray-600";
const TAB_ACTIVE = "px-2.5 py-1 text-xs rounded-md cursor-pointer bg-gray-100 font-medium text-gray-700";

// Markdown notes with a fast Write/Preview toggle (GitHub-style). Opens in
// preview when there is content to read, in write mode when empty; clicking
// the rendered preview jumps straight back into editing.
export function NotesEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<Mode>(value.trim() ? "preview" : "write");

  return (
    <div className="flex-1 flex flex-col min-h-0 mb-4">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <label className="text-xs text-gray-400 uppercase tracking-wide">Notes</label>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => setMode("write")} className={mode === "write" ? TAB_ACTIVE : TAB}>
            Write
          </button>
          <button type="button" onClick={() => setMode("preview")} className={mode === "preview" ? TAB_ACTIVE : TAB}>
            Preview
          </button>
        </div>
      </div>

      {mode === "write" ? (
        <textarea
          autoFocus={Boolean(value.trim())}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"Add notes in markdown...\n\n# Title\n- [ ] checklist\n**bold**, `code`, tables..."}
          className="flex-1 w-full text-xs text-gray-700 outline-none resize-none bg-gray-50 rounded-md p-3 border border-gray-200 focus:border-gray-300 font-mono leading-relaxed"
        />
      ) : (
        <div
          onClick={() => setMode("write")}
          title="Click to edit"
          className="flex-1 overflow-y-auto rounded-md border border-gray-200 bg-white p-3 cursor-text"
        >
          {value.trim() ? (
            <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-gray-300">Nothing to preview — click to write.</p>
          )}
        </div>
      )}
      <p className="text-[10px] text-gray-300 mt-1 shrink-0">Markdown (GFM) supported. Auto-saved.</p>
    </div>
  );
}
