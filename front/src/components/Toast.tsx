import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  variant: Variant;
}

interface ToastContextValue {
  toast: (message: string, variant?: Variant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// App-wide toast access. Mounted once at the router root (see __root.tsx).
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const VARIANT_STYLE: Record<Variant, string> = {
  success: "border-border bg-white text-gray-900",
  error: "border-destructive/30 bg-white text-destructive",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((message: string, variant: Variant = "success") => {
    setItems((prev) => [...prev, { id: nextId.current++, message, variant }]);
  }, []);

  const remove = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right" duration={4000}>
        {children}
        {items.map((item) => (
          <RadixToast.Root
            key={item.id}
            onOpenChange={(open) => !open && remove(item.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
              "transition-all data-[state=closed]:opacity-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0",
              VARIANT_STYLE[item.variant],
            )}
          >
            <RadixToast.Title className="flex-1 font-medium">{item.message}</RadixToast.Title>
            <RadixToast.Close aria-label="Close" className="text-gray-400 outline-none hover:text-gray-600">
              <X className="h-4 w-4" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-0 right-0 z-[100] flex w-80 max-w-[100vw] flex-col gap-2 p-4 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
