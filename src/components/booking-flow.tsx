"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Clock,
  PencilLine,
  Check,
  Users,
  CalendarOff,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/field";
import { PhysicianAvatar } from "@/components/avatar";
import { cn, formatDateLong, formatDateDow, formatTime, dayKey } from "@/lib/utils";
import {
  patientDetailsSchema,
  type PatientDetails,
} from "@/lib/validations";
import {
  createBooking,
  getAvailableSlots,
  type SerializedSlot,
} from "@/actions/bookings";

type Physician = {
  id: string;
  name: string;
  specialty: string;
  bio: string;
};

type Slot = {
  id: string;
  startTime: Date;
  endTime: Date;
};

// Server actions serialize Date to ISO string at the RSC boundary.
// Hydrate them back into Date objects at the use site.
function hydrateSlots(raw: SerializedSlot[]): Slot[] {
  return raw.map((s) => ({
    id: s.id,
    startTime: new Date(s.startTime),
    endTime: new Date(s.endTime),
  }));
}

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Clinician",
  2: "Time",
  3: "Your details",
  4: "Review",
};

const STEP_ICONS: Record<Step, LucideIcon> = {
  1: UserRound,
  2: Clock,
  3: PencilLine,
  4: Check,
};

export function BookingFlow({ physicians }: { physicians: Physician[] }) {
  const router = useRouter();

  const [step, setStep] = React.useState<Step>(1);
  const [selectedPhysician, setSelectedPhysician] =
    React.useState<Physician | null>(null);
  const [slots, setSlots] = React.useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null);
  const [details, setDetails] = React.useState<PatientDetails>({
    patientName: "",
    patientDob: "",
    patientEmail: "",
    patientPhone: "",
    reasonForVisit: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [topLevelError, setTopLevelError] = React.useState<string | null>(null);

  // Load slots when a physician is selected
  React.useEffect(() => {
    if (!selectedPhysician) return;
    let cancelled = false;
    setSlotsLoading(true);
    getAvailableSlots(selectedPhysician.id)
      .then((data) => {
        if (cancelled) return;
        setSlots(hydrateSlots(data));
        setSlotsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load slots", err);
        setSlots([]);
        setSlotsLoading(false);
        setTopLevelError(
          "We couldn't load available times. Please pick a different clinician or refresh the page.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPhysician]);

  function goTo(s: Step) {
    setStep(s);
    setTopLevelError(null);
  }

  // ---- Step 1 handlers ----
  function handlePickPhysician(p: Physician) {
    setSelectedPhysician(p);
    setSelectedSlot(null);
    setSlots(null);
    goTo(2);
  }

  // ---- Step 2 handlers ----
  function handlePickSlot(slot: Slot) {
    setSelectedSlot(slot);
    goTo(3);
  }

  // ---- Step 3 handlers ----
  function handleSubmitDetails(e: React.FormEvent) {
    e.preventDefault();
    const result = patientDetailsSchema.safeParse(details);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        newErrors[issue.path.join(".")] = issue.message;
      }
      setErrors(newErrors);
      return;
    }
    setErrors({});
    goTo(4);
  }

  // ---- Step 4 handler ----
  async function handleConfirm() {
    if (!selectedPhysician || !selectedSlot) return;
    setSubmitting(true);
    setTopLevelError(null);

    const result = await createBooking({
      ...details,
      physicianId: selectedPhysician.id,
      slotId: selectedSlot.id,
    });

    if (result.ok) {
      router.push(`/book/confirm?id=${result.bookingId}`);
      return;
    }

    setSubmitting(false);

    if (result.error === "SLOT_TAKEN") {
      // Refresh slot list and bounce user back to step 2 with their form data intact
      setTopLevelError(
        "That time was just booked by someone else. Please choose another time — your details are saved.",
      );
      setSelectedSlot(null);
      setSlots(null);
      goTo(2);
      // re-fetch
      if (selectedPhysician) {
        setSlotsLoading(true);
        try {
          const fresh = await getAvailableSlots(selectedPhysician.id);
          setSlots(hydrateSlots(fresh));
        } catch (e) {
          console.error("Failed to refresh slots after conflict", e);
          setSlots([]);
        } finally {
          setSlotsLoading(false);
        }
      }
    } else if (result.error === "VALIDATION") {
      setErrors(result.issues);
      goTo(3);
      setTopLevelError("Please correct the highlighted fields.");
    } else {
      setTopLevelError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-10">
      <Stepper current={step} onJumpBack={(s) => step > s && goTo(s)} />

      {topLevelError && (
        <div className="rounded border border-signal-cancelled/30 bg-signal-cancelled/5 px-4 py-3 text-[14px] text-signal-cancelled">
          {topLevelError}
        </div>
      )}

      <div key={step} className="step-fade">
        {step === 1 && (
          <StepPhysician
            physicians={physicians}
            selectedId={selectedPhysician?.id}
            onPick={handlePickPhysician}
          />
        )}

        {step === 2 && selectedPhysician && (
          <StepSlot
            physician={selectedPhysician}
            slots={slots}
            loading={slotsLoading}
            selectedId={selectedSlot?.id}
            onPick={handlePickSlot}
            onBack={() => goTo(1)}
          />
        )}

        {step === 3 && (
          <StepDetails
            details={details}
            errors={errors}
            onChange={setDetails}
            onSubmit={handleSubmitDetails}
            onBack={() => goTo(2)}
          />
        )}

        {step === 4 && selectedPhysician && selectedSlot && (
          <StepReview
            physician={selectedPhysician}
            slot={selectedSlot}
            details={details}
            submitting={submitting}
            onConfirm={handleConfirm}
            onBack={() => goTo(3)}
            onEditPhysician={() => goTo(1)}
            onEditSlot={() => goTo(2)}
            onEditDetails={() => goTo(3)}
          />
        )}
      </div>
    </div>
  );
}

// ---------- Stepper ----------

function Stepper({
  current,
  onJumpBack,
}: {
  current: Step;
  onJumpBack: (s: Step) => void;
}) {
  return (
    <ol className="flex items-center gap-3 text-[13px]">
      {([1, 2, 3, 4] as Step[]).map((n, i) => {
        const active = n === current;
        const done = n < current;
        const StepIcon = STEP_ICONS[n];
        return (
          <React.Fragment key={n}>
            <li className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={!done}
                onClick={() => onJumpBack(n)}
                aria-current={active ? "step" : undefined}
                aria-label={`${STEP_LABELS[n]}${done ? " (completed)" : active ? " (current)" : ""}`}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                  active &&
                    "border-forest-400 bg-forest-400 text-cream-50",
                  done &&
                    "border-forest-300 bg-cream-50 text-forest-300 hover:bg-forest-50 cursor-pointer",
                  !active &&
                    !done &&
                    "border-stone-border bg-cream-50 text-stone-muted",
                )}
              >
                {done ? (
                  <Check key="done" size={15} strokeWidth={2.5} className="check-pop" />
                ) : (
                  <StepIcon size={15} strokeWidth={2} />
                )}
              </button>
              <span
                className={cn(
                  "hidden sm:inline",
                  active ? "text-ink-300 font-medium" : "text-stone-muted",
                )}
              >
                {STEP_LABELS[n]}
              </span>
            </li>
            {i < 3 && <span className="stepper-line" />}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

// ---------- Step 1 ----------

function StepPhysician({
  physicians,
  selectedId,
  onPick,
}: {
  physicians: Physician[];
  selectedId?: string;
  onPick: (p: Physician) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-3xl text-ink-300">Choose a clinician</h2>
      <p className="mt-2 text-[15px] text-ink-100">
        Pick the physician you'd like to see.
      </p>

      {physicians.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clinicians available"
          body="Please check back soon."
        />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {physicians.map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p)}
                aria-pressed={active}
                className={cn(
                  "group surface text-left p-6 transition-all",
                  "hover:border-forest-300 hover:bg-cream-50",
                  active && "border-forest-400 ring-2 ring-forest-400/20",
                )}
              >
                <div className="flex items-start gap-4">
                  <PhysicianAvatar name={p.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] uppercase tracking-[0.16em] text-forest-300">
                          {p.specialty}
                        </p>
                        <h3 className="mt-1.5 font-display text-2xl text-ink-300">
                          {p.name}
                        </h3>
                      </div>
                      <span
                        aria-hidden
                        className="shrink-0 text-stone-muted transition-transform group-hover:translate-x-0.5 group-hover:text-forest-300"
                      >
                        →
                      </span>
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-ink-100">
                      {p.bio}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Step 2 ----------

function StepSlot({
  physician,
  slots,
  loading,
  selectedId,
  onPick,
  onBack,
}: {
  physician: Physician;
  slots: Slot[] | null;
  loading: boolean;
  selectedId?: string;
  onPick: (s: Slot) => void;
  onBack: () => void;
}) {
  // Group slots by day
  const grouped = React.useMemo(() => {
    if (!slots) return [];
    const byDay = new Map<string, Slot[]>();
    for (const s of slots) {
      const k = dayKey(s.startTime);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k)!.push(s);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, slots]) => ({ key: k, date: slots[0].startTime, slots }));
  }, [slots]);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink-300">Choose a time</h2>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Change clinician
        </Button>
      </div>
      <p className="mt-2 text-[15px] text-ink-100">
        Available appointments with{" "}
        <span className="font-medium text-ink-300">{physician.name}</span> over
        the next two weeks. Each visit is 30 minutes.
      </p>

      {loading ? (
        <div className="mt-10 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-40 animate-pulse rounded bg-cream-200" />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                  <div
                    key={j}
                    className="h-10 animate-pulse rounded bg-cream-200"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No availability in the next two weeks"
          body="This clinician's schedule is fully booked. Try another clinician."
          action={
            <Button variant="secondary" onClick={onBack}>
              Choose another clinician
            </Button>
          }
        />
      ) : (
        <div className="mt-8 space-y-8">
          {grouped.map((g) => (
            <div key={g.key}>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="font-display text-xl text-ink-300">
                  {formatDateLong(g.date)}
                </span>
                <span className="text-[12px] uppercase tracking-[0.16em] text-stone-muted">
                  {formatDateDow(g.date)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                {g.slots.map((s) => {
                  const active = s.id === selectedId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onPick(s)}
                      aria-pressed={active}
                      className={cn(
                        "h-10 rounded border text-[14px] font-medium tabular-nums",
                        "transition-[transform,colors,box-shadow] duration-150 ease-out",
                        active
                          ? "border-forest-400 bg-forest-400 text-cream-50 scale-[1.02]"
                          : "border-stone-border bg-cream-50 text-ink-200 hover:border-forest-300 hover:bg-cream-200 hover:scale-[1.03] active:scale-[0.97]",
                      )}
                    >
                      {formatTime(s.startTime)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Step 3 ----------

function StepDetails({
  details,
  errors,
  onChange,
  onSubmit,
  onBack,
}: {
  details: PatientDetails;
  errors: Record<string, string>;
  onChange: (d: PatientDetails) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink-300">Your details</h2>
        <Button variant="ghost" size="sm" type="button" onClick={onBack}>
          ← Change time
        </Button>
      </div>
      <p className="mt-2 text-[15px] text-ink-100">
        We'll use this to confirm your appointment and send reminders.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="patientName">Full name</Label>
          <Input
            id="patientName"
            autoComplete="name"
            value={details.patientName}
            onChange={(e) =>
              onChange({ ...details, patientName: e.target.value })
            }
            aria-invalid={!!errors.patientName}
          />
          <FieldError>{errors.patientName}</FieldError>
        </div>

        <div>
          <Label htmlFor="patientDob">Date of birth</Label>
          <Input
            id="patientDob"
            type="date"
            value={details.patientDob}
            onChange={(e) =>
              onChange({ ...details, patientDob: e.target.value })
            }
            aria-invalid={!!errors.patientDob}
            max={new Date().toISOString().split("T")[0]}
          />
          <FieldError>{errors.patientDob}</FieldError>
        </div>

        <div>
          <Label htmlFor="patientPhone">Phone</Label>
          <Input
            id="patientPhone"
            type="tel"
            autoComplete="tel"
            placeholder="(555) 123-4567"
            value={details.patientPhone}
            onChange={(e) =>
              onChange({ ...details, patientPhone: e.target.value })
            }
            aria-invalid={!!errors.patientPhone}
          />
          <FieldError>{errors.patientPhone}</FieldError>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="patientEmail">Email</Label>
          <Input
            id="patientEmail"
            type="email"
            autoComplete="email"
            value={details.patientEmail}
            onChange={(e) =>
              onChange({ ...details, patientEmail: e.target.value })
            }
            aria-invalid={!!errors.patientEmail}
          />
          <FieldError>{errors.patientEmail}</FieldError>
        </div>

        <div className="md:col-span-2">
          <Label
            htmlFor="reasonForVisit"
            hint={`${details.reasonForVisit.length}/500`}
          >
            Reason for visit
          </Label>
          <Textarea
            id="reasonForVisit"
            placeholder="A brief description helps your clinician prepare. e.g., 'Annual check-up' or 'Follow-up on blood pressure medication.'"
            value={details.reasonForVisit}
            onChange={(e) =>
              onChange({ ...details, reasonForVisit: e.target.value })
            }
            aria-invalid={!!errors.reasonForVisit}
            maxLength={500}
          />
          <FieldError>{errors.reasonForVisit}</FieldError>
          <p className="mt-1.5 text-[12px] text-stone-muted">
            This information is treated as protected health information.
          </p>
        </div>
      </div>

      <div className="mt-10 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}

// ---------- Step 4 ----------

function StepReview({
  physician,
  slot,
  details,
  submitting,
  onConfirm,
  onBack,
  onEditPhysician,
  onEditSlot,
  onEditDetails,
}: {
  physician: Physician;
  slot: Slot;
  details: PatientDetails;
  submitting: boolean;
  onConfirm: () => void;
  onBack: () => void;
  onEditPhysician: () => void;
  onEditSlot: () => void;
  onEditDetails: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-3xl text-ink-300">
        Review your booking
      </h2>
      <p className="mt-2 text-[15px] text-ink-100">
        Submitting this creates a booking{" "}
        <span className="font-medium text-ink-300">request</span>. The clinic
        will confirm shortly.
      </p>

      <div className="mt-8 surface divide-y divide-stone-border">
        <ReviewRow label="Clinician" onEdit={onEditPhysician}>
          <p className="font-medium text-ink-300">{physician.name}</p>
          <p className="text-[14px] text-ink-100">{physician.specialty}</p>
        </ReviewRow>

        <ReviewRow label="Appointment" onEdit={onEditSlot}>
          <p className="font-medium text-ink-300">
            {formatDateLong(slot.startTime)}
          </p>
          <p className="text-[14px] text-ink-100 tabular-nums">
            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
          </p>
        </ReviewRow>

        <ReviewRow label="Patient" onEdit={onEditDetails}>
          <p className="font-medium text-ink-300">{details.patientName}</p>
          <p className="text-[14px] text-ink-100">
            DOB {details.patientDob} · {details.patientEmail} ·{" "}
            {details.patientPhone}
          </p>
        </ReviewRow>

        <ReviewRow label="Reason for visit" onEdit={onEditDetails}>
          <p className="text-[15px] leading-relaxed text-ink-200">
            {details.reasonForVisit}
          </p>
        </ReviewRow>
      </div>

      <div className="mt-10 flex justify-between gap-3">
        <Button variant="secondary" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button onClick={onConfirm} disabled={submitting} size="lg">
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden />
              Submitting…
            </>
          ) : (
            "Confirm booking"
          )}
        </Button>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  children,
  onEdit,
}: {
  label: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 px-6 py-5 sm:flex-row sm:items-start sm:gap-6">
      <div className="w-40 shrink-0 text-[12px] uppercase tracking-[0.16em] text-stone-muted pt-1">
        {label}
      </div>
      <div className="flex-1">{children}</div>
      <button
        type="button"
        onClick={onEdit}
        className="text-[13px] text-forest-300 hover:text-forest-400 hover:underline"
      >
        Edit
      </button>
    </div>
  );
}

// ---------- Empty state ----------

function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-10 surface-muted px-8 py-12 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream-50 text-forest-300">
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="font-display text-2xl text-ink-300">{title}</h3>
      <p className="mt-2 text-[15px] text-ink-100">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
