import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { api, tokens } from "@/lib/api";
import { meQueryOptions, type User } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

const searchSchema = z.object({ code: z.string().optional(), error: z.string().optional() });

interface ExchangeResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export const Route = createFileRoute("/auth/callback")({
  component: CallbackPage,
  validateSearch: searchSchema,
});

function CallbackPage() {
  const { code, error } = Route.useSearch();
  const navigate = useNavigate();
  const ran = useRef(false);
  const [failed, setFailed] = useState(Boolean(error));

  useEffect(() => {
    if (ran.current || error || !code) return;
    ran.current = true;

    api
      .post<ExchangeResponse>("/v1/auth/oauth/exchange", { code })
      .then((data) => {
        tokens.set(data.access_token, data.refresh_token);
        queryClient.setQueryData(meQueryOptions.queryKey, data.user);
        if (data.user.accounts.length > 0) {
          tokens.setAccount(data.user.accounts[0].slug);
          navigate({ to: "/board" });
        } else {
          navigate({ to: "/no-workspace" });
        }
      })
      .catch(() => setFailed(true));
  }, [code, error, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-6 text-center">
        {failed ? (
          <>
            <h1 className="mb-2 text-xl font-bold text-gray-900">Sign-in failed</h1>
            <p className="text-sm text-gray-500">Something went wrong. Please try again.</p>
            <p className="mt-4 text-sm"><Link to="/login" className="text-primary hover:underline">Back to sign in</Link></p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Signing you in…</p>
        )}
      </div>
    </div>
  );
}
