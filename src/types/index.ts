// Booking status is stored as a string in SQLite. We constrain it here.
export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export function isValidStatus(s: string): s is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(s);
}

// State machine: which transitions are allowed from each status.
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"], // confirmed bookings can be cancelled (e.g., patient calls)
  CANCELLED: [], // terminal
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function statusLabel(s: BookingStatus): string {
  return { PENDING: "Pending", CONFIRMED: "Confirmed", CANCELLED: "Cancelled" }[s];
}
