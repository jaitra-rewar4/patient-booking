import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateLong(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateDow(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function dayKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Format an ISO date string (YYYY-MM-DD) as "Month D, YYYY" without going
// through a Date object. Avoids the timezone shift that `new Date("1990-01-01")`
// causes in negative-UTC-offset locales (where the day can render as the day
// before). Returns the input unchanged if it doesn't match YYYY-MM-DD.
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export function formatDob(dob: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return dob;
  const [, y, mm, d] = m;
  const month = MONTHS[parseInt(mm!, 10) - 1];
  return `${month} ${parseInt(d!, 10)}, ${y}`;
}
