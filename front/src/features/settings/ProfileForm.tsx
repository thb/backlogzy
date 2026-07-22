import { useSuspenseQuery } from "@tanstack/react-query";
import { meQueryOptions } from "@/lib/auth";
import { Field } from "@/components/Field";
import { ImageField } from "@/components/ImageField";
import { FormError } from "@/components/FieldError";
import { useUpdateProfile } from "./hooks";

export function ProfileForm() {
  const { data: user } = useSuspenseQuery(meQueryOptions);
  const mutation = useUpdateProfile();

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const avatar = e.currentTarget.elements.namedItem("avatar") as HTMLInputElement;
        mutation.mutate({
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          file: avatar?.files?.[0] ?? null,
          removeAvatar: fd.get("avatar_remove") === "1",
        });
      }}
    >
      <FormError mutation={mutation} />
      <ImageField label="Avatar" name="avatar" mutation={mutation} currentUrl={user.avatar_url} size={56} circle />
      <Field label="Name" name="name" mutation={mutation} defaultValue={user.name} autoComplete="name" required />
      <Field label="Email" name="email" type="email" mutation={mutation} defaultValue={user.email} autoComplete="email" required />

      <div className="flex items-center gap-3">
        <button
          type="submit" disabled={mutation.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save"}
        </button>
        {mutation.isSuccess && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </form>
  );
}
