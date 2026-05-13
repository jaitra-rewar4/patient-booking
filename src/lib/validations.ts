import { z } from "zod";

// Patient details schema, used by both the form and the server action.
export const patientDetailsSchema = z.object({
  patientName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  patientDob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker")
    // Reject calendar-invalid dates like 2020-02-30. `new Date()` silently
    // rolls those forward (Feb 30 -> Mar 1), which would otherwise pass the
    // not-NaN check below.
    .refine((v) => {
      const d = new Date(v);
      if (isNaN(d.getTime())) return false;
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}` === v;
    }, "Enter a valid date")
    .refine((v) => new Date(v) < new Date(), "Date of birth must be in the past"),
  patientEmail: z.string().email("Enter a valid email address"),
  patientPhone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(30, "Phone number is too long")
    // Allow common phone formats: digits, spaces, dashes, parens, dots,
    // and an optional +. Length and digit-count are enforced separately.
    .regex(
      /^[+\d\s().\-]+$/,
      "Enter a valid phone number (digits, spaces, dashes, parens, optional leading +)",
    )
    // Even with separators, require at least 7 actual digits.
    .refine(
      (s) => s.replace(/\D/g, "").length >= 7,
      "Phone number needs at least 7 digits",
    ),
  reasonForVisit: z
    .string()
    .min(5, "Please describe the reason for your visit (5+ characters)")
    .max(500, "Please keep this under 500 characters"),
});

export type PatientDetails = z.infer<typeof patientDetailsSchema>;

export const createBookingSchema = patientDetailsSchema.extend({
  physicianId: z.string().min(1),
  slotId: z.string().min(1),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
