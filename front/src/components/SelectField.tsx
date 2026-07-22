import { FieldError, type AnyMutation } from "./FieldError";
import type { Option } from "./RadioField";

interface SelectFieldProps {
  label: string;
  name: string;
  options: Option[];
  mutation: AnyMutation;
  multiple?: boolean;
  defaultValue?: string | string[] | null;
}

// Uncontrolled <select>. Single: FormData.get(name). Multiple: FormData.getAll(name).
export function SelectField({ label, name, options, mutation, multiple, defaultValue }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <select
        id={name}
        name={name}
        multiple={multiple}
        defaultValue={defaultValue ?? (multiple ? [] : "")}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 ${multiple ? "h-28" : ""}`}
      >
        {!multiple && <option value="">—</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <FieldError mutation={mutation} field={name} />
    </div>
  );
}
