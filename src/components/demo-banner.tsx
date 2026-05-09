export function DemoBanner() {
  return (
    <div className="border-b border-stone-border bg-cream-200/60">
      <div className="mx-auto max-w-6xl px-6 py-2 text-center text-[12px] tracking-wide text-ink-100">
        <span className="font-medium">Demo environment.</span>{" "}
        <span className="text-ink-50">
          Sample data only — not for clinical use. No real PHI is stored.
        </span>
      </div>
    </div>
  );
}
