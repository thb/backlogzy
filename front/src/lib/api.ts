const API_BASE = import.meta.env.VITE_API_URL ?? "";

// Full-page OAuth start URL (must hit the API origin, not the SPA).
export function oauthUrl(provider: "google_oauth2" | "github"): string {
  return `${API_BASE}/auth/${provider}`;
}

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(status: number, data: { error?: { message?: string }; errors?: Record<string, string[]> }) {
    super(data.error?.message ?? "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.errors = data.errors ?? {};
  }
}

export const tokens = {
  access: () => localStorage.getItem("access_token"),
  refresh: () => localStorage.getItem("refresh_token"),
  account: () => localStorage.getItem("account_slug"),
  set(access: string, refresh: string) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  },
  setAccount: (slug: string) => localStorage.setItem("account_slug", slug),
  clear() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("account_slug");
  },
};

// Single in-flight refresh shared across concurrent 401s.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokens.refresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const { data } = await res.json();
    tokens.set(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokens.access();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const account = tokens.account();
  if (account) headers["X-Account"] = account;
  return headers;
}

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    sp.append(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  const url = `${API_BASE}${path}${method === "GET" ? toQuery(params) : ""}`;
  const send = () => fetch(url, { method, headers: buildHeaders(), body: body ? JSON.stringify(body) : undefined });

  let res = await send();

  if (res.status === 401 && tokens.refresh()) {
    refreshPromise ??= refreshAccessToken();
    const refreshed = await refreshPromise;
    refreshPromise = null;
    if (refreshed) {
      res = await send();
    } else {
      tokens.clear();
      window.location.href = "/login";
      throw new ApiError(401, { error: { message: "Session expired" } });
    }
  }

  // Empty body (204, 202, …) — parse only when there's content.
  const text = await res.text();
  const json = text ? JSON.parse(text) : undefined;

  if (!res.ok) throw new ApiError(res.status, json ?? {});
  if (json === undefined) return undefined as T;

  // Unwrap a sole `{ data }` envelope; keep `{ data, meta }` (paginated) intact.
  if (json.data !== undefined && Object.keys(json).length === 1) return json.data as T;
  return json as T;
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>) => request<T>("GET", path, undefined, params),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
