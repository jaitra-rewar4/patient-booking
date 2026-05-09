"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const fieldClasses = cn(
  "w-full rounded border border-stone-border bg-cream-50 px-3 py-2.5 text-ink-300 text-[15px]",
  "placeholder:text-stone-muted",
  "focus-visible:outline-none focus-visible:border-forest-400 focus-visible:ring-2 focus-visible:ring-forest-400/20",
  "transition-colors",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClasses, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldClasses, "min-h-[100px] resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { hint?: string }
>(({ className, children, hint, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "flex items-baseline justify-between mb-1.5 text-[13px] font-medium text-ink-200",
      className,
    )}
    {...props}
  >
    <span>{children}</span>
    {hint && <span className="text-stone-muted font-normal">{hint}</span>}
  </label>
));
Label.displayName = "Label";

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 text-[13px] text-signal-cancelled">{children}</p>
  );
}
