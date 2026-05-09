import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";
import { AdminTable } from "@/components/admin-table";
import { getBookings } from "@/actions/bookings";

export default async function AdminPage() {
  const bookings = await getBookings();

  return (
    <>
      <DemoBanner />
      <header className="border-b border-stone-border bg-cream-50/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-[20px] tracking-tight text-ink-300">
              Apex Health
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone-muted">
              Demo · Clinic admin
            </span>
          </Link>
          <Link
            href="/book"
            className="text-[13px] text-stone-muted hover:text-ink-200"
          >
            ← Patient view
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-8">
          <p className="text-[12px] uppercase tracking-[0.2em] text-forest-300">
            Operations
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-ink-300">
            Bookings
          </h1>
          <p className="mt-2 text-[15px] text-ink-100">
            Review patient booking requests and manage their status.
          </p>
        </div>

        <AdminTable bookings={bookings} />
      </main>
    </>
  );
}
