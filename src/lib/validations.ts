import { z } from "zod";

// Patient details schema, used by both the form and the server action.
export const patientDetailsSchema = z.object({
  patientName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  patientDob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker")
    .refine((v) => {
      const d = new Date(v);
      return !isNaN(d.getTime()) && d < new Date();
    }, "Date of birth must be in the past"),
  patientEmail: z.string().email("Enter a valid email address"),
  patientPhone: z
    .string()
    .min(7, "Phone number is too short")
    .max(30, "Phone number is too long"),
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
