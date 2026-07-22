import { Field } from "@/components/Field";
import { FormError } from "@/components/FieldError";
import { useChangePassword } from "./hooks";

export function ChangePasswordForm() {
  const mutation = useChangePassword();

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        mutation.mutate(
          { current_password: String(fd.get("current_password") ?? ""), password: String(fd.get("password") ?? "") },
          { onSuccess: () => form.reset() },
        );
      }}
    >
      <FormError mutation={mutation} />
      <Field label="Current password" name="current_password" type="password" mutation={mutation} autoComplete="current-password" required />
      <Field label="New password" name="password" type="password" mutation={mutation} autoComplete="new-password" required />

      <div className="flex items-center gap-3">
        <button
          type="submit" disabled={mutation.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Change password"}
        </button>
        {mutation.isSuccess && <span className="text-sm text-green-600">Password changed</span>}
      </div>
    </form>
  );
}
