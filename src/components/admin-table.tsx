"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Search, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { EmailPreview } from "@/components/email-preview";
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
  return (
    <ToastProvider>
      <AdminTableInner bookings={bookings} />
    </ToastProvider>
  );
}

function AdminTableInner({ bookings }: { bookings: AdminBooking[] }) {
  const router = useRouter();
  const toast = useToast();

  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [physicianFilter, setPhysicianFilter] = React.useState<string>("ALL");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [openDialogId, setOpenDialogId] = React.useState<string | null>(null);

  const [searchInput, setSearchInput] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  const physicians = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bookings) map.set(b.physician.id, b.physician.name);
    return Array.from(map.entries());
  }, [bookings]);

  const filtered = React.useMemo(() => {
    return bookings.filter((b) => {
      if (filter !== "ALL" && b.status !== filter) return false;
      if (physicianFilter !== "ALL" && b.physician.id !== physicianFilter) return false;
      if (searchQuery && !b.patientName.toLowerCase().includes(searchQuery)) return false;
      return true;
    });
  }, [bookings, filter, physicianFilter, searchQuery]);

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

  const stats = React.useMemo(() => computeStats(bookings), [bookings]);

  const openBooking = bookings.find((b) => b.id === openDialogId) ?? null;

  async function handleAction(bookingId: string, nextStatus: BookingStatus) {
    setPendingId(bookingId);
    const res = await updateBookingStatus(bookingId, nextStatus);
    setPendingId(null);
    if (!res.ok) {
      toast({
        variant: "error",
        title: "Couldn't update booking",
        description:
          res.error === "INVALID_TRANSITION"
            ? "That status change isn't allowed from the current state."
            : "Please retry. If this keeps happening, refresh the page.",
      });
      return;
    }
    toast({
      variant: "success",
      title:
        nextStatus === "CONFIRMED"
          ? "Booking confirmed"
          : "Booking cancelled",
    });
    router.refresh();
  }

  return (
    <div>
      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pending" value={counts.PENDING} accent="pending" />
        <StatCard label="Confirmed" value={counts.CONFIRMED} accent="confirmed" />
        <StatCard label="Today" value={stats.today} />
        <StatCard label="This week" value={stats.thisWeek} />
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-4 border-b border-stone-border pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "CONFIRMED", "CANCELLED"] as const).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={active}
                className={cn(
                  "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
                  active
                    ? "border-ink-300 bg-ink-300 text-cream-50"
                    : "border-stone-border bg-cream-50 text-ink-100 hover:border-ink-100",
                )}
              >
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                <span
                  className={cn(
                    "ml-2 text-[12px]",
                    active ? "text-cream-50/70" : "text-stone-muted",
                  )}
                >
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-muted"
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search patient name…"
              aria-label="Search by patient name"
              className="h-9 w-full rounded border border-stone-border bg-cream-50 pl-8 pr-3 text-[13px] text-ink-200 placeholder:text-stone-muted focus-visible:border-forest-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400/20 sm:w-56"
            />
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
      </div>

      {/* Table (md+) */}
      <div className="mt-6 hidden md:block">
        {filtered.length === 0 ? (
          <EmptyResult />
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
                    onOpen={() => setOpenDialogId(b.id)}
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
          <EmptyResult />
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

      {/* Booking detail dialog (desktop interaction) */}
      <Dialog
        open={!!openBooking}
        onOpenChange={(o) => !o && setOpenDialogId(null)}
      >
        {openBooking && (
          <BookingDialogContent
            booking={openBooking}
            pending={pendingId === openBooking.id}
            onAction={async (s) => {
              await handleAction(openBooking.id, s);
              setOpenDialogId(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

// ---------- Stat card ----------

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "pending" | "confirmed";
}) {
  return (
    <div className="surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-stone-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-3xl tracking-tight tabular-nums",
          accent === "pending" && "text-signal-pending",
          accent === "confirmed" && "text-signal-confirmed",
          !accent && "text-ink-300",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyResult() {
  return (
    <div className="surface-muted flex flex-col items-center px-8 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-50 text-forest-300">
        <Inbox size={20} strokeWidth={1.75} />
      </div>
      <p className="font-display text-xl text-ink-300">
        No bookings match these filters
      </p>
      <p className="mt-1 text-[14px] text-ink-100">
        Try clearing the filters above.
      </p>
    </div>
  );
}

// ---------- Row (desktop) ----------

function BookingRow({
  booking: b,
  onOpen,
}: {
  booking: AdminBooking;
  onOpen: () => void;
}) {
  const status = b.status as BookingStatus;
  return (
    <tr
      tabIndex={0}
      role="button"
      aria-label={`View details for ${b.patientName}'s booking`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer transition-colors hover:bg-cream-50 focus-visible:bg-cream-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest-400"
    >
      <td className="px-5 py-4">
        <p className="font-medium text-ink-300">{b.patientName}</p>
        <p className="text-[12px] text-stone-muted">DOB {b.patientDob}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-ink-200">{b.physician.name}</p>
        <p className="text-[12px] text-stone-muted">{b.physician.specialty}</p>
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
      <td className="px-5 py-4 text-right text-[12px] text-stone-muted">
        Open →
      </td>
    </tr>
  );
}

// ---------- Dialog content ----------

function BookingDialogContent({
  booking: b,
  pending,
  onAction,
}: {
  booking: AdminBooking;
  pending: boolean;
  onAction: (s: BookingStatus) => Promise<void> | void;
}) {
  const status = b.status as BookingStatus;
  const [showEmail, setShowEmail] = React.useState(false);

  return (
    <DialogContent>
      <DialogHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DialogTitle>{b.patientName}</DialogTitle>
            <DialogDescription>
              Booking with {b.physician.name} &middot; {b.physician.specialty}
            </DialogDescription>
          </div>
          <StatusBadge status={status} />
        </div>
      </DialogHeader>

      <DialogBody>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <DetailField label="Email" value={b.patientEmail} />
          <DetailField label="Phone" value={b.patientPhone} />
          <DetailField label="Date of birth" value={b.patientDob} />
          <DetailField label="Booked at" value={formatDateLong(b.createdAt)} />
          <DetailField
            label="Appointment"
            value={`${formatDateLong(b.slot.startTime)} · ${formatTime(b.slot.startTime)}–${formatTime(b.slot.endTime)}`}
            wide
          />
          <DetailField
            label="Reason for visit"
            value={b.reasonForVisit}
            wide
          />
          <DetailField label="Booking ID" value={b.id} mono wide />
        </div>

        <div className="mt-6 border-t border-stone-border pt-5">
          <button
            type="button"
            onClick={() => setShowEmail((v) => !v)}
            aria-expanded={showEmail}
            className="text-[13px] font-medium text-forest-300 hover:text-forest-400 hover:underline"
          >
            {showEmail ? "Hide email preview" : "View email preview"}
          </button>
          {showEmail && (
            <div className="mt-4 step-fade rounded-lg border border-stone-border bg-cream-200/40 p-4">
              <EmailPreview
                patientName={b.patientName}
                patientEmail={b.patientEmail}
                physician={{
                  name: b.physician.name,
                  specialty: b.physician.specialty,
                }}
                slot={{
                  startTime: b.slot.startTime,
                  endTime: b.slot.endTime,
                }}
                bookingId={b.id}
              />
            </div>
          )}
        </div>
      </DialogBody>

      <DialogFooter>
        {status === "CANCELLED" && (
          <p className="mr-auto self-center text-[13px] text-stone-muted">
            Cancelled bookings cannot be reactivated.
          </p>
        )}
        {canTransition(status, "CANCELLED") && (
          <Button
            variant="danger"
            onClick={() => onAction("CANCELLED")}
            disabled={pending}
          >
            <X size={15} aria-hidden />
            Cancel booking
          </Button>
        )}
        {canTransition(status, "CONFIRMED") && (
          <Button
            onClick={() => onAction("CONFIRMED")}
            disabled={pending}
          >
            <Check size={15} aria-hidden />
            {pending ? "Confirming…" : "Confirm booking"}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
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
            {formatDateShort(b.slot.startTime)} · {formatTime(b.slot.startTime)}
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
            <Check size={14} aria-hidden />
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
            <X size={14} aria-hidden />
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
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-stone-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-[14px] text-ink-200",
          mono && "font-mono text-[13px] break-all",
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ---------- Helpers ----------

function computeStats(bookings: AdminBooking[]) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const startOfWeek = new Date(startOfToday);
  // Treat the current week as "next 7 days from today" for forward-looking ops
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  let today = 0;
  let thisWeek = 0;
  for (const b of bookings) {
    if (b.status === "CANCELLED") continue;
    const t = new Date(b.slot.startTime).getTime();
    if (t >= startOfToday.getTime() && t < endOfToday.getTime()) today++;
    if (t >= startOfWeek.getTime() && t < endOfWeek.getTime()) thisWeek++;
  }
  return { today, thisWeek };
}
