import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types";
import { statusLabel } from "@/types";

const styles: Record<BookingStatus, string> = {
  PENDING:
    "bg-signal-pending/10 text-signal-pending border-signal-pending/30",
  CONFIRMED:
    "bg-signal-confirmed/10 text-signal-confirmed border-signal-confirmed/30",
  CANCELLED:
    "bg-signal-cancelled/10 text-signal-cancelled border-signal-cancelled/30",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium uppercase tracking-wider",
        styles[status],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "PENDING" && "bg-signal-pending",
          status === "CONFIRMED" && "bg-signal-confirmed",
          status === "CANCELLED" && "bg-signal-cancelled",
        )}
      />
      {statusLabel(status)}
    </span>
  );
}
