import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";

export default function HomePage() {
  return (
    <>
      <DemoBanner />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-16 pt-10 md:pt-20">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-[22px] tracking-tight text-ink-300">
              Apex Health
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone-muted">
              Demo
            </span>
          </Link>
        </header>

        {/* Hero */}
        <section className="mt-20 md:mt-28 max-w-3xl">
          <p className="text-[13px] uppercase tracking-[0.2em] text-forest-300">
            Patient portal
          </p>
          <h1 className="word-reveal mt-5 font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance text-ink-300">
            {"Book a visit with a clinician you trust."
              .split(" ")
              .map((word, i, arr) => (
                <span key={i} style={{ animationDelay: `${i * 70}ms` }}>
                  {word}
                  {i < arr.length - 1 ? " " : ""}
                </span>
              ))}
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-100">
            Choose a physician, pick a time that works, and tell us what brings
            you in. The clinic confirms each request before your appointment is
            final.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/book"
              className="inline-flex h-12 items-center justify-center rounded bg-forest-400 px-7 text-[15px] font-medium text-cream-50 transition-colors hover:bg-forest-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100"
            >
              Book an appointment
              <span aria-hidden className="ml-2">→</span>
            </Link>
            <Link
              href="/admin"
              className="inline-flex h-12 items-center justify-center rounded border border-stone-border bg-cream-50 px-7 text-[15px] font-medium text-ink-200 transition-colors hover:bg-cream-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100"
            >
              Clinic admin
            </Link>
          </div>
        </section>

        {/* Three-step explainer */}
        <section className="mt-24 md:mt-32 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "Choose a clinician",
              body: "Browse our team by specialty and read a short bio for each.",
            },
            {
              n: "02",
              title: "Pick a time",
              body: "See live availability for the next two weeks. Slots update in real time.",
            },
            {
              n: "03",
              title: "Get confirmed",
              body: "Submit your details and reason for visit. The clinic confirms shortly after.",
            },
          ].map((s) => (
            <div key={s.n}>
              <div className="font-mono text-[12px] tracking-wider text-forest-300">
                {s.n}
              </div>
              <h3 className="mt-3 font-display text-2xl text-ink-300">
                {s.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-100">
                {s.body}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-stone-border bg-cream-200/30 py-6">
        <div className="mx-auto max-w-5xl px-6 text-[13px] text-stone-muted">
          A take-home project · {new Date().getFullYear()}
        </div>
      </footer>
    </>
  );
}
