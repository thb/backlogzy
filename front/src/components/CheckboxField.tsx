import { FieldError, type AnyMutation } from "./FieldError";

interface CheckboxFieldProps {
  label: string;
  name: string;
  mutation: AnyMutation;
  defaultChecked?: boolean;
}

// Uncontrolled single checkbox — read via FormData.get(name) (present = checked) on submit.
export function CheckboxField({ label, name, mutation, defaultChecked }: CheckboxFieldProps) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} />
        {label}
      </label>
      <FieldError mutation={mutation} field={name} />
    </div>
  );
}
