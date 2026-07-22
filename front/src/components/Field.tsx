import { FieldError, type AnyMutation } from "./FieldError";

interface FieldProps {
  label: string;
  name: string;
  mutation: AnyMutation;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
  autoComplete?: string;
}

// Uncontrolled input: no value/onChange, edit pre-fills via defaultValue.
export function Field({ label, name, mutation, type = "text", defaultValue, required, autoComplete }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && " *"}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
      <FieldError mutation={mutation} field={name} />
    </div>
  );
}
