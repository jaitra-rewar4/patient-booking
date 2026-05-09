import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmailPreview } from "@/components/email-preview";
import { getBookingById } from "@/actions/bookings";
import {
  formatDateLong,
  formatTime,
} from "@/lib/utils";
import type { BookingStatus } from "@/types";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  const booking = await getBookingById(id);
  if (!booking) notFound();

  return (
    <>
      <DemoBanner />
      <header className="border-b border-stone-border bg-cream-50/50">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-[20px] tracking-tight text-ink-300">
              Apex Health
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone-muted">
              Demo
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-20">
        <div className="text-center">
          <div className="success-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-50 text-forest-400">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <p className="mt-6 text-[12px] uppercase tracking-[0.2em] text-forest-300">
            Request received
          </p>
          <h1 className="mt-4 font-display text-4xl md:text-5xl tracking-tight text-ink-300 text-balance">
            Your booking has been requested.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-100">
            We've sent the details to{" "}
            <span className="font-medium text-ink-300">
              {booking.patientEmail}
            </span>
            . The clinic will confirm shortly.
          </p>
        </div>

        <div className="mt-12 surface divide-y divide-stone-border">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-[12px] uppercase tracking-[0.16em] text-stone-muted">
              Status
            </span>
            <StatusBadge status={booking.status as BookingStatus} />
          </div>
          <div className="px-6 py-5">
            <p className="text-[12px] uppercase tracking-[0.16em] text-stone-muted">
              Clinician
            </p>
            <p className="mt-1.5 font-medium text-ink-300">
              {booking.physician.name}
            </p>
            <p className="text-[14px] text-ink-100">
              {booking.physician.specialty}
            </p>
          </div>
          <div className="px-6 py-5">
            <p className="text-[12px] uppercase tracking-[0.16em] text-stone-muted">
              When
            </p>
            <p className="mt-1.5 font-medium text-ink-300">
              {formatDateLong(booking.slot.startTime)}
            </p>
            <p className="text-[14px] text-ink-100 tabular-nums">
              {formatTime(booking.slot.startTime)} –{" "}
              {formatTime(booking.slot.endTime)}
            </p>
          </div>
          <div className="px-6 py-5">
            <p className="text-[12px] uppercase tracking-[0.16em] text-stone-muted">
              Booking ID
            </p>
            <p className="mt-1.5 font-mono text-[13px] text-ink-200">
              {booking.id}
            </p>
          </div>
        </div>

        <div className="mt-10 surface-muted px-6 py-5">
          <p className="font-medium text-ink-300">What happens next?</p>
          <ul className="mt-3 space-y-2 text-[14px] text-ink-100">
            <li className="flex gap-3">
              <span className="font-mono text-forest-300">1.</span>
              <span>
                The clinic reviews your request and confirms the appointment
                (typically within 1 business day).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-forest-300">2.</span>
              <span>
                You'll receive a confirmation email at{" "}
                <span className="text-ink-200">{booking.patientEmail}</span>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-forest-300">3.</span>
              <span>A reminder is sent the day before your visit.</span>
            </li>
          </ul>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/book"
            className="inline-flex h-11 items-center justify-center rounded border border-stone-border bg-cream-50 px-6 text-[14px] font-medium text-ink-200 hover:bg-cream-200"
          >
            Book another appointment
          </Link>
        </div>

        {/* Email preview */}
        <section className="mt-16">
          <div className="mb-4 flex flex-col items-baseline gap-1 sm:flex-row sm:gap-3">
            <h2 className="font-display text-xl tracking-tight text-ink-300">
              Email preview
            </h2>
            <p className="text-[13px] text-stone-muted">
              This is what would be sent to your inbox in production.
            </p>
          </div>
          <div className="rounded-lg border border-stone-border bg-cream-200/40 p-4 sm:p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
            <EmailPreview
              patientName={booking.patientName}
              patientEmail={booking.patientEmail}
              physician={{
                name: booking.physician.name,
                specialty: booking.physician.specialty,
              }}
              slot={{
                startTime: booking.slot.startTime,
                endTime: booking.slot.endTime,
              }}
              bookingId={booking.id}
            />
          </div>
        </section>
      </main>
    </>
  );
}
