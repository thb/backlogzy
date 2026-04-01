export function generateId(): string {
  return crypto.randomUUID()
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

export function nowISO(): string {
  return new Date().toISOString()
}
