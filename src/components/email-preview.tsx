import { formatDateLong, formatTime } from "@/lib/utils";

type EmailPreviewProps = {
  patientName: string;
  patientEmail: string;
  physician: { name: string; specialty: string };
  slot: { startTime: Date | string; endTime: Date | string };
  bookingId: string;
};

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] ?? full;
}

export function EmailPreview({
  patientName,
  patientEmail,
  physician,
  slot,
  bookingId,
}: EmailPreviewProps) {
  return (
    <div className="mx-auto w-full max-w-[520px] overflow-hidden rounded-lg border border-stone-border bg-white">
      {/* Branded header */}
      <div className="bg-forest-400 px-6 py-5">
        <p className="font-display text-[20px] tracking-tight text-cream-50">
          Apex Health
        </p>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-cream-50/70">
          Appointment request received
        </p>
      </div>

      <div className="px-6 py-7">
        <p className="font-display text-[22px] leading-tight tracking-tight text-ink-300">
          Hi {firstName(patientName)},
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-100">
          We received your appointment request. The clinic will review and
          confirm shortly &mdash; usually within one business day. We&apos;ll
          send another email the moment it&apos;s confirmed.
        </p>

        {/* Appointment summary card */}
        <div className="mt-6 rounded border border-stone-border bg-cream-50">
          <div className="border-b border-stone-border px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-stone-muted">
              Your request
            </p>
          </div>
          <div className="divide-y divide-stone-border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] uppercase tracking-wider text-stone-muted">
                Clinician
              </span>
              <span className="text-right text-[13px] font-medium text-ink-300">
                {physician.name}
                <span className="ml-2 font-normal text-ink-100">
                  &middot; {physician.specialty}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] uppercase tracking-wider text-stone-muted">
                When
              </span>
              <span className="text-right text-[13px] font-medium text-ink-300 tabular-nums">
                {formatDateLong(slot.startTime)}
                <span className="ml-2 font-normal text-ink-100">
                  {formatTime(slot.startTime)}&ndash;{formatTime(slot.endTime)}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] uppercase tracking-wider text-stone-muted">
                Booking ID
              </span>
              <span className="font-mono text-[12px] text-ink-200">
                {bookingId}
              </span>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="mt-7">
          <p className="text-[13px] font-medium text-ink-300">
            What happens next
          </p>
          <ol className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-ink-100">
            <li className="flex gap-3">
              <span className="font-mono text-forest-300">1.</span>
              <span>
                The clinic reviews your request and confirms the appointment
                (typically within one business day).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-forest-300">2.</span>
              <span>
                You&apos;ll receive a confirmation email at this address (
                <span className="text-ink-200">{patientEmail}</span>).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-forest-300">3.</span>
              <span>
                A reminder will arrive the day before your visit.
              </span>
            </li>
          </ol>
        </div>

        <p className="mt-7 text-[13px] leading-relaxed text-ink-100">
          Need to make a change? Reply to this email or call us at{" "}
          <span className="text-ink-200">(416) 555-0100</span>.
        </p>
        <p className="mt-5 text-[13px] text-ink-100">
          Take care,
          <br />
          <span className="font-medium text-ink-300">The Apex Health team</span>
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-stone-border bg-cream-100 px-6 py-4 text-[11px] leading-relaxed text-stone-muted">
        Apex Health Clinic &middot; 200 Wellness Lane, Toronto ON
        <br />
        This email was sent because you requested an appointment. If this
        wasn&apos;t you, please disregard.
      </div>
    </div>
  );
}
