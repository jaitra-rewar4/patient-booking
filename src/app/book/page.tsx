import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";
import { Logo } from "@/components/logo";
import { BookingFlow } from "@/components/booking-flow";
import { getPhysicians } from "@/actions/physicians";

export default async function BookPage() {
  const physicians = await getPhysicians();

  return (
    <>
      <DemoBanner />
      <header className="border-b border-stone-border bg-cream-50/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Apex Health home">
            <Logo size={26} subtitle="Demo" />
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
