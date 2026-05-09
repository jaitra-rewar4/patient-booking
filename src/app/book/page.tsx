import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";
import { BookingFlow } from "@/components/booking-flow";
import { getPhysicians } from "@/actions/physicians";

export default async function BookPage() {
  const physicians = await getPhysicians();

  return (
    <>
      <DemoBanner />
      <header className="border-b border-stone-border bg-cream-50/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-[20px] tracking-tight text-ink-300">
              Apex Health
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone-muted">
              Demo
            </span>
          </Link>
          <Link
            href="/admin"
            className="text-[13px] text-stone-muted hover:text-ink-200"
          >
            Clinic admin →
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 md:py-16">
        <BookingFlow physicians={physicians} />
      </main>
    </>
  );
}
