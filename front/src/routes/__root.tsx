import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ToastProvider } from "@/components/Toast";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <ToastProvider>
      <Outlet />
      <TanStackRouterDevtools position="bottom-left" />
    </ToastProvider>
  ),
});
