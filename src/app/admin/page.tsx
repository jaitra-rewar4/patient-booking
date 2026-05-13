import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";
import { Logo } from "@/components/logo";
import { AdminTable } from "@/components/admin-table";
import { getBookings } from "@/actions/bookings";
import { signOutAction } from "@/actions/auth";

// Bookings change on every request (new submissions, status updates).
// Force dynamic rendering so the page always reads fresh data from the
// DB instead of serving a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const bookings = await getBookings();

  return (
    <>
      <DemoBanner />
      <header className="border-b border-stone-border bg-cream-50/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Apex Health home">
            <Logo size={26} subtitle="Demo · Clinic admin" />
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/book"
              className="text-[13px] text-stone-muted hover:text-ink-200"
            >
              ← Patient view
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-[13px] text-stone-muted hover:text-ink-200"
              >
                Sign out
              </button>
            </form>
          </div>
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
