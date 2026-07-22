import { ApiError } from "@/lib/api";

// Shared form components only need these two fields, so any concrete useMutation result fits.
export interface AnyMutation {
  error: Error | null;
  isPending: boolean;
}

export function FieldError({ mutation, field }: { mutation: AnyMutation; field: string }) {
  const error = mutation.error;
  if (!(error instanceof ApiError)) return null;
  const message = error.errors[field]?.[0];
  return message ? <p className="mt-1 text-sm text-destructive">{message}</p> : null;
}

// Global / base-level error (validation key `base`, or a non-API failure).
export function FormError({ mutation }: { mutation: AnyMutation }) {
  const error = mutation.error;
  if (!error) return null;

  if (error instanceof ApiError) {
    const base = error.errors.base?.[0];
    if (base) return <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{base}</div>;
    // Business error with no per-field errors (e.g. invalid credentials) — show its message.
    if (Object.keys(error.errors).length === 0) {
      return <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error.message}</div>;
    }
    return null; // field errors are rendered next to each field
  }

  return <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Something went wrong. Please try again.</div>;
}
