"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  cn,
  formatDateLong,
  formatTime,
  formatDateShort,
} from "@/lib/utils";
import { updateBookingStatus } from "@/actions/bookings";
import {
  type BookingStatus,
  BOOKING_STATUSES,
  canTransition,
} from "@/types";

type AdminBooking = {
  id: string;
  patientName: string;
  patientDob: string;
  patientEmail: string;
  patientPhone: string;
  reasonForVisit: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  physician: { id: string; name: string; specialty: string };
  slot: { id: string; startTime: Date; endTime: Date };
};

type Filter = "ALL" | BookingStatus;

export function AdminTable({ bookings }: { bookings: AdminBooking[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [physicianFilter, setPhysicianFilter] = React.useState<string>("ALL");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [openRow, setOpenRow] = React.useState<string | null>(null);

  const physicians = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bookings) map.set(b.physician.id, b.physician.name);
    return Array.from(map.entries());
  }, [bookings]);

  const filtered = React.useMemo(() => {
    return bookings.filter((b) => {
      if (filter !== "ALL" && b.status !== filter) return false;
      if (physicianFilter !== "ALL" && b.physician.id !== physicianFilter)
        return false;
      return true;
    });
  }, [bookings, filter, physicianFilter]);

  const counts = React.useMemo(() => {
    const c: Record<BookingStatus | "ALL", number> = {
      ALL: bookings.length,
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
    };
    for (const b of bookings) {
      if (BOOKING_STATUSES.includes(b.status as BookingStatus)) {
        c[b.status as BookingStatus]++;
      }
    }
    return c;
  }, [bookings]);

  async function handleAction(
    bookingId: string,
    nextStatus: BookingStatus,
  ) {
    setPendingId(bookingId);
    setActionError(null);
    const res = await updateBookingStatus(bookingId, nextStatus);
    setPendingId(null);
    if (!res.ok) {
      setActionError(
        res.error === "INVALID_TRANSITION"
          ? "That status change isn't allowed."
          : "Could not update the booking. Please retry.",
      );
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-4 border-b border-stone-border pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "CONFIRMED", "CANCELLED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
                filter === f
                  ? "border-ink-300 bg-ink-300 text-cream-50"
                  : "border-stone-border bg-cream-50 text-ink-100 hover:border-ink-100",
              )}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              <span
                className={cn(
                  "ml-2 text-[12px]",
                  filter === f ? "text-cream-50/70" : "text-stone-muted",
                )}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="physicianFilter"
            className="text-[13px] text-stone-muted"
          >
            Clinician
          </label>
          <select
            id="physicianFilter"
            value={physicianFilter}
            onChange={(e) => setPhysicianFilter(e.target.value)}
            className="h-9 rounded border border-stone-border bg-cream-50 px-3 text-[13px] text-ink-200 focus-visible:border-forest-400 focus-visible:outline-none"
          >
            <option value="ALL">All clinicians</option>
            {physicians.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError && (
        <div className="mt-4 rounded border border-signal-cancelled/30 bg-signal-cancelled/5 px-4 py-3 text-[13px] text-signal-cancelled">
          {actionError}
        </div>
      )}

      {/* Table (md+) */}
      <div className="mt-6 hidden md:block">
        {filtered.length === 0 ? (
          <div className="surface-muted px-8 py-12 text-center">
            <p className="font-display text-xl text-ink-300">
              No bookings match these filters
            </p>
            <p className="mt-1 text-[14px] text-ink-100">
              Try clearing the filters above.
            </p>
          </div>
        ) : (
          <div className="surface overflow-hidden">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-cream-200/50 text-[12px] uppercase tracking-wider text-stone-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Clinician</th>
                  <th className="px-5 py-3 font-medium">Appointment</th>
                  <th className="px-5 py-3 font-medium">Reason</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-border">
                {filtered.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    expanded={openRow === b.id}
                    pending={pendingId === b.id}
                    onToggle={() =>
                      setOpenRow(openRow === b.id ? null : b.id)
                    }
                    onAction={(s) => handleAction(b.id, s)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cards (mobile) */}
      <div className="mt-6 space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="surface-muted px-6 py-10 text-center">
            <p className="font-display text-xl text-ink-300">
              No bookings match these filters
            </p>
          </div>
        ) : (
          filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              pending={pendingId === b.id}
              onAction={(s) => handleAction(b.id, s)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------- Row (desktop) ----------

function BookingRow({
  booking: b,
  expanded,
  pending,
  onToggle,
  onAction,
}: {
  booking: AdminBooking;
  expanded: boolean;
  pending: boolean;
  onToggle: () => void;
  onAction: (s: BookingStatus) => void;
}) {
  const status = b.status as BookingStatus;
  return (
    <>
      <tr
        className="cursor-pointer transition-colors hover:bg-cream-50"
        onClick={onToggle}
      >
        <td className="px-5 py-4">
          <p className="font-medium text-ink-300">{b.patientName}</p>
          <p className="text-[12px] text-stone-muted">DOB {b.patientDob}</p>
        </td>
        <td className="px-5 py-4">
          <p className="text-ink-200">{b.physician.name}</p>
          <p className="text-[12px] text-stone-muted">
            {b.physician.specialty}
          </p>
        </td>
        <td className="px-5 py-4 tabular-nums">
          <p className="text-ink-200">{formatDateShort(b.slot.startTime)}</p>
          <p className="text-[12px] text-stone-muted">
            {formatTime(b.slot.startTime)}
          </p>
        </td>
        <td className="px-5 py-4 max-w-[260px]">
          <p className="truncate text-ink-100" title={b.reasonForVisit}>
            {b.reasonForVisit}
          </p>
        </td>
        <td className="px-5 py-4">
          <StatusBadge status={status} />
        </td>
        <td className="px-5 py-4 text-right">
          <span className="text-[12px] text-stone-muted">
            {expanded ? "▲" : "▼"}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-cream-200/30">
          <td colSpan={6} className="px-5 py-5">
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
              <DetailField label="Email" value={b.patientEmail} />
              <DetailField label="Phone" value={b.patientPhone} />
              <DetailField
                label="Booked at"
                value={formatDateLong(b.createdAt)}
              />
              <DetailField
                label="Full appointment"
                value={`${formatDateLong(b.slot.startTime)} · ${formatTime(b.slot.startTime)}–${formatTime(b.slot.endTime)}`}
              />
              <DetailField
                label="Booking ID"
                value={b.id}
                mono
              />
              <DetailField
                label="Reason for visit"
                value={b.reasonForVisit}
                wide
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-border pt-4">
              {canTransition(status, "CONFIRMED") && (
                <Button
                  size="sm"
                  onClick={() => onAction("CONFIRMED")}
                  disabled={pending}
                >
                  {pending ? "Confirming…" : "Confirm booking"}
                </Button>
              )}
              {canTransition(status, "CANCELLED") && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => onAction("CANCELLED")}
                  disabled={pending}
                >
                  Cancel booking
                </Button>
              )}
              {status === "CANCELLED" && (
                <p className="text-[13px] text-stone-muted">
                  Cancelled bookings cannot be reactivated.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------- Card (mobile) ----------

function BookingCard({
  booking: b,
  pending,
  onAction,
}: {
  booking: AdminBooking;
  pending: boolean;
  onAction: (s: BookingStatus) => void;
}) {
  const status = b.status as BookingStatus;
  return (
    <div className="surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink-300">{b.patientName}</p>
          <p className="text-[12px] text-stone-muted">DOB {b.patientDob}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-stone-muted">
            Clinician
          </p>
          <p className="text-ink-200">{b.physician.name}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-stone-muted">
            When
          </p>
          <p className="text-ink-200 tabular-nums">
            {formatDateShort(b.slot.startTime)} ·{" "}
            {formatTime(b.slot.startTime)}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wider text-stone-muted">
          Reason
        </p>
        <p className="text-[14px] text-ink-100">{b.reasonForVisit}</p>
      </div>
      <div className="mt-3 text-[12px] text-stone-muted">
        {b.patientEmail} · {b.patientPhone}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-border pt-3">
        {canTransition(status, "CONFIRMED") && (
          <Button
            size="sm"
            onClick={() => onAction("CONFIRMED")}
            disabled={pending}
          >
            Confirm
          </Button>
        )}
        {canTransition(status, "CANCELLED") && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => onAction("CANCELLED")}
            disabled={pending}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-3" : ""}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-stone-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-[14px] text-ink-200",
          mono && "font-mono text-[13px]",
        )}
      >
        {value}
      </p>
    </div>
  );
}
