"use client";

import * as React from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "info";

type ToastConfig = {
  title: string;
  description?: string;
  variant?: Variant;
};

type ToastItem = ToastConfig & { id: number; open: boolean };

type ShowToast = (t: ToastConfig) => void;

const ToastCtx = React.createContext<ShowToast | null>(null);

export function useToast(): ShowToast {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const show = React.useCallback<ShowToast>((t) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { ...t, id, open: true }]);
  }, []);

  const setOpen = (id: number, open: boolean) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open } : t)));
  };

  const variantStyles: Record<Variant, string> = {
    success: "border-forest-300/40 bg-forest-50",
    error: "border-signal-cancelled/30 bg-signal-cancelled/5",
    info: "border-stone-border bg-cream-50",
  };

  const variantIcon: Record<Variant, React.ReactNode> = {
    success: <CheckCircle2 size={18} className="text-forest-400" />,
    error: <AlertCircle size={18} className="text-signal-cancelled" />,
    info: <AlertCircle size={18} className="text-ink-200" />,
  };

  return (
    <ToastCtx.Provider value={show}>
      <RadixToast.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((t) => {
          const variant: Variant = t.variant ?? "info";
          return (
            <RadixToast.Root
              key={t.id}
              open={t.open}
              onOpenChange={(o) => setOpen(t.id, o)}
              className={cn(
                "toast-root grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border px-4 py-3 shadow-[0_8px_24px_-12px_rgba(26,24,22,0.25)]",
                variantStyles[variant],
              )}
            >
              <div className="pt-0.5">{variantIcon[variant]}</div>
              <div className="min-w-0">
                <RadixToast.Title className="text-[14px] font-medium text-ink-300">
                  {t.title}
                </RadixToast.Title>
                {t.description && (
                  <RadixToast.Description className="mt-0.5 text-[13px] text-ink-100">
                    {t.description}
                  </RadixToast.Description>
                )}
              </div>
              <RadixToast.Close
                aria-label="Dismiss"
                className="rounded p-0.5 text-stone-muted hover:bg-cream-200 hover:text-ink-200"
              >
                <X size={14} />
              </RadixToast.Close>
            </RadixToast.Root>
          );
        })}
        <RadixToast.Viewport
          className={cn(
            "fixed bottom-4 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none",
          )}
        />
      </RadixToast.Provider>
    </ToastCtx.Provider>
  );
}
