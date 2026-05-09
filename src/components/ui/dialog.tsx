"use client";

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Content>) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        className={cn(
          "dlg-overlay fixed inset-0 z-40 bg-ink-300/30 backdrop-blur-[1px]",
        )}
      />
      <RadixDialog.Content
        className={cn(
          "dlg-content fixed left-1/2 top-1/2 z-50 grid w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 gap-0",
          "rounded-lg border border-stone-border bg-cream-50 shadow-[0_20px_50px_-20px_rgba(26,24,22,0.25)]",
          "max-h-[88vh] overflow-y-auto",
          className,
        )}
        {...props}
      >
        {children}
        <RadixDialog.Close
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-stone-muted transition-colors hover:bg-cream-200 hover:text-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400"
        >
          <X size={16} />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-b border-stone-border px-6 py-5 pr-12",
        className,
      )}
      {...props}
    />
  );
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Title>
>(({ className, ...props }, ref) => (
  <RadixDialog.Title
    ref={ref}
    className={cn(
      "font-display text-2xl tracking-tight text-ink-300",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(({ className, ...props }, ref) => (
  <RadixDialog.Description
    ref={ref}
    className={cn("mt-1 text-[14px] text-ink-100", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap justify-end gap-2 border-t border-stone-border bg-cream-100/60 px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}
