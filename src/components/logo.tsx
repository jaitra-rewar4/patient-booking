import { cn } from "@/lib/utils";

type Variant = "dark" | "light";

type LogoMarkProps = {
  size?: number;
  className?: string;
  variant?: Variant;
};

// A single-circle monogram. "Dark" = forest fill + cream letter (default,
// for use on cream backgrounds). "Light" = cream fill + forest letter
// (for use on the forest-green email-banner background).
export function LogoMark({
  size = 32,
  className,
  variant = "dark",
}: LogoMarkProps) {
  const isDark = variant === "dark";
  const bg = isDark ? "#2C4A47" : "#F8F5EF";
  const fg = isDark ? "#FBF9F4" : "#2C4A47";
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <circle cx="20" cy="20" r="20" fill={bg} />
      <text
        x="20"
        y="28"
        textAnchor="middle"
        fill={fg}
        fontFamily="var(--font-fraunces), Georgia, serif"
        fontSize="24"
        fontWeight={500}
        fontStyle="italic"
      >
        A
      </text>
    </svg>
  );
}

// Full lockup: mark + wordmark. Pass `subtitle` for the small uppercase
// tag (e.g. "Demo", "Demo · Clinic admin").
type LogoProps = LogoMarkProps & {
  subtitle?: string;
  textColor?: string; // override wordmark color (defaults to ink-300)
};

export function Logo({
  size = 28,
  className,
  variant = "dark",
  subtitle,
  textColor,
}: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} variant={variant} />
      <span className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-display text-[22px] tracking-tight",
            !textColor && "text-ink-300",
          )}
          style={textColor ? { color: textColor } : undefined}
        >
          Apex Health
        </span>
        {subtitle && (
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone-muted">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
