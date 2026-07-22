import { FieldError, type AnyMutation } from "./FieldError";

export interface Option {
  value: string;
  label: string;
}

interface RadioFieldProps {
  label: string;
  name: string;
  options: Option[];
  mutation: AnyMutation;
  defaultValue?: string | null;
}

// Uncontrolled radio group — read via FormData.get(name) on submit.
export function RadioField({ label, name, options, mutation, defaultValue }: RadioFieldProps) {
  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-gray-700">{label}</legend>
      <div className="flex flex-wrap gap-4">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-1.5 text-sm text-gray-700">
            <input type="radio" name={name} value={o.value} defaultChecked={defaultValue === o.value} />
            {o.label}
          </label>
        ))}
      </div>
      <FieldError mutation={mutation} field={name} />
    </fieldset>
  );
}
