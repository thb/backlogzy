import { queryOptions } from "@tanstack/react-query";
import { api, tokens } from "./api";
import { queryClient } from "./queryClient";

// The membership for the currently selected account (X-Account), and an admin check.
export function currentMembership(user: User): AccountSummary | undefined {
  const slug = tokens.account();
  return user.accounts.find((a) => a.slug === slug) ?? user.accounts[0];
}

export function isAdmin(user: User): boolean {
  return user.super_admin || currentMembership(user)?.role === "admin";
}

export interface AccountSummary {
  id: string;
  slug: string;
  name: string;
  role: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  super_admin: boolean;
  avatar_url: string | null;
  accounts: AccountSummary[];
}

export function getMe(): Promise<User> {
  return api.get<User>("/v1/auth/me");
}

// The current user is server state. Routes guard on this query, never on token presence.
export const meQueryOptions = queryOptions({
  queryKey: ["me"],
  queryFn: getMe,
  staleTime: 5 * 60_000,
  retry: false,
});

interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export async function login(email: string, password: string): Promise<User> {
  const data = await api.post<LoginResponse>("/v1/auth/login", { auth: { email, password } });
  tokens.set(data.access_token, data.refresh_token);
  if (data.user.accounts.length > 0) tokens.setAccount(data.user.accounts[0].slug);
  queryClient.setQueryData(meQueryOptions.queryKey, data.user);
  return data.user;
}

interface SignupParams {
  workspace: string;
  name: string;
  email: string;
  password: string;
}

// Self-serve registration: creates a workspace + admin user, then auto-logs in.
export async function signup(params: SignupParams): Promise<User> {
  const data = await api.post<LoginResponse>("/v1/auth/signup", { auth: params });
  tokens.set(data.access_token, data.refresh_token);
  if (data.user.accounts.length > 0) tokens.setAccount(data.user.accounts[0].slug);
  queryClient.setQueryData(meQueryOptions.queryKey, data.user);
  return data.user;
}

// Create a workspace for an already-authenticated user with none (post-OAuth signup).
export async function createWorkspace(workspace: string): Promise<User> {
  const user = await api.post<User>("/v1/onboarding", { workspace });
  if (user.accounts.length > 0) tokens.setAccount(user.accounts[0].slug);
  queryClient.setQueryData(meQueryOptions.queryKey, user);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await api.delete("/v1/auth/logout");
  } finally {
    tokens.clear();
    queryClient.removeQueries({ queryKey: ["me"] });
  }
}
