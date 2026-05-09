import { cn } from "@/lib/utils";

const PALETTE = [
  { bg: "bg-forest-100", fg: "text-forest-400" },
  { bg: "bg-forest-50", fg: "text-forest-500" },
  { bg: "bg-cream-300", fg: "text-ink-300" },
  { bg: "bg-cream-400", fg: "text-forest-500" },
  { bg: "bg-forest-200", fg: "text-cream-50" },
  { bg: "bg-ink-50/15", fg: "text-ink-200" },
] as const;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string) {
  const parts = name.replace(/^Dr\.?\s+/i, "").trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function PhysicianAvatar({
  name,
  size = 56,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const c = PALETTE[hash(name) % PALETTE.length]!;
  return (
    <div
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-display tracking-tight",
        c.bg,
        c.fg,
        className,
      )}
    >
      <span style={{ fontSize: size * 0.42 }}>{initials(name)}</span>
    </div>
  );
}
