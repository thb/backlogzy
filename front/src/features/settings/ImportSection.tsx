import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface ImportResult {
  projects: number;
  items: number;
  habits: number;
  pomodoros: number;
}

// One-time import of a legacy backlogzy backup (the JSON exported by the old
// localStorage app). Projects and items land in the current workspace.
export function ImportSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: unknown) => api.post<ImportResult>("/v1/import", payload),
    onSuccess: (result) => {
      qc.invalidateQueries();
      toast(`Imported ${result.projects} projects, ${result.items} items.`);
    },
  });

  async function handleFile(file: File) {
    setError(null);
    try {
      const data = JSON.parse(await file.text());
      if (!data.projects || !data.items) throw new Error("not a backlogzy backup");
      mutation.mutate({
        projects: data.projects,
        items: data.items,
        habits: data.habits ?? {},
        pomodoros: data.pomodoros ?? {},
      });
    } catch {
      setError("This file doesn't look like a backlogzy backup (missing projects/items).");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Upload a JSON backup from the old local backlogzy to copy its projects and items into
        this workspace.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {mutation.isPending ? "Importing…" : "Import backup…"}
      </button>
      {(error || mutation.isError) && (
        <p className="text-sm text-destructive">{error ?? "Import failed — nothing was saved."}</p>
      )}
    </div>
  );
}
