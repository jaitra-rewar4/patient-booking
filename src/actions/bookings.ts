"use server";

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { createBookingSchema } from "@/lib/validations";
import {
  type BookingStatus,
  canTransition,
  isValidStatus,
} from "@/types";
import { revalidatePath } from "next/cache";

// ---------- Read ----------

// Ordering: actionable first. PENDING needs the clinic's attention,
// CONFIRMED is informational, CANCELLED is historical. Prisma 5 can't
// express a non-alphabetical enum priority in `orderBy` without raw SQL,
// so we fetch newest-first per status and resort in memory — the bookings
// list is small enough that this is free.
const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  CANCELLED: 2,
};

export async function getBookings() {
  const bookings = await db.booking.findMany({
    include: {
      physician: { select: { id: true, name: true, specialty: true } },
      slot: { select: { id: true, startTime: true, endTime: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return bookings.sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 99;
    const pb = STATUS_PRIORITY[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function getAvailableSlots(physicianId: string) {
  // A slot is available if it has no active (PENDING or CONFIRMED) booking
  // and starts in the future.
  const now = new Date();
  const slots = await db.slot.findMany({
    where: {
      physicianId,
      startTime: { gt: now },
      bookings: { none: { status: { in: ["PENDING", "CONFIRMED"] } } },
    },
    orderBy: { startTime: "asc" },
  });
  return slots;
}

// ---------- Create ----------

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: "VALIDATION"; issues: Record<string, string> }
  | { ok: false; error: "SLOT_TAKEN" }
  | { ok: false; error: "SLOT_NOT_FOUND" }
  | { ok: false; error: "INTERNAL" };

export async function createBooking(
  raw: unknown,
): Promise<CreateBookingResult> {
  const parsed = createBookingSchema.safeParse(raw);
  if (!parsed.success) {
    const issues: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      issues[issue.path.join(".")] = issue.message;
    }
    return { ok: false, error: "VALIDATION", issues };
  }
  const data = parsed.data;

  try {
    // Transaction: re-check that the slot is free, then create. This narrows
    // the race-condition window but doesn't fully eliminate it on SQLite.
    // In Postgres I'd add a partial unique index on
    // (slotId) WHERE status != 'CANCELLED' as a hard guarantee.
    const booking = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const slot = await tx.slot.findUnique({
        where: { id: data.slotId },
        include: {
          bookings: { where: { status: { in: ["PENDING", "CONFIRMED"] } } },
        },
      });
      if (!slot) throw new Error("SLOT_NOT_FOUND");
      if (slot.physicianId !== data.physicianId)
        throw new Error("SLOT_NOT_FOUND");
      if (slot.bookings.length > 0) throw new Error("SLOT_TAKEN");

      return tx.booking.create({
        data: {
          physicianId: data.physicianId,
          slotId: data.slotId,
          patientName: data.patientName.trim(),
          patientDob: data.patientDob,
          patientEmail: data.patientEmail.trim().toLowerCase(),
          patientPhone: data.patientPhone.trim(),
          reasonForVisit: data.reasonForVisit.trim(),
          status: "PENDING",
        },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/book");
    return { ok: true, bookingId: booking.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL";
    if (msg === "SLOT_TAKEN") return { ok: false, error: "SLOT_TAKEN" };
    if (msg === "SLOT_NOT_FOUND") return { ok: false, error: "SLOT_NOT_FOUND" };
    console.error("createBooking error", e);
    return { ok: false, error: "INTERNAL" };
  }
}

// ---------- Update status ----------

export type UpdateStatusResult =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" | "INVALID_STATUS" | "INVALID_TRANSITION" };

export async function updateBookingStatus(
  bookingId: string,
  nextStatus: string,
): Promise<UpdateStatusResult> {
  if (!isValidStatus(nextStatus))
    return { ok: false, error: "INVALID_STATUS" };

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, error: "NOT_FOUND" };

  const current = booking.status as BookingStatus;
  if (!canTransition(current, nextStatus))
    return { ok: false, error: "INVALID_TRANSITION" };

  await db.booking.update({
    where: { id: bookingId },
    data: { status: nextStatus },
  });

  revalidatePath("/admin");
  revalidatePath("/book");
  return { ok: true };
}

// ---------- Single booking (for confirmation page) ----------

export async function getBookingById(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: {
      physician: true,
      slot: true,
    },
  });
}
