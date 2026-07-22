import { useState } from "react";
import { FieldError, type AnyMutation } from "./FieldError";

const INPUT_CLS =
  "block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm hover:file:bg-gray-200";

interface ImageFieldProps {
  label: string;
  name: string;
  mutation: AnyMutation;
  currentUrl?: string | null;
  size?: number;
  circle?: boolean;
}

// Uncontrolled image upload with delete support. The form reads `<name>` (the File)
// and `<name>_remove` (a hidden flag) from FormData on submit. The few bits of UI
// state (chosen-file preview, remove-pending) are ephemeral useState.
export function ImageField({ label, name, mutation, currentUrl, size = 48, circle }: ImageFieldProps) {
  const [removed, setRemoved] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ?? (currentUrl && !removed ? currentUrl : null);
  const rounded = circle ? "rounded-full" : "rounded";

  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        {shown && <img src={shown} alt="" className={`${rounded} object-cover`} style={{ width: size, height: size }} />}
        <input
          id={name}
          name={name}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
            if (file) setRemoved(false);
          }}
          className={INPUT_CLS}
        />
        {currentUrl && !preview && !removed && (
          <button type="button" onClick={() => setRemoved(true)} className="shrink-0 text-sm text-destructive hover:underline">Remove</button>
        )}
        {removed && (
          <button type="button" onClick={() => setRemoved(false)} className="shrink-0 text-sm text-gray-500 hover:underline">Undo</button>
        )}
      </div>
      {removed && <p className="mt-1 text-xs text-gray-400">Will be removed on save.</p>}
      <input type="hidden" name={`${name}_remove`} value={removed ? "1" : ""} readOnly />
      <FieldError mutation={mutation} field={`${name}_key`} />
    </div>
  );
}
