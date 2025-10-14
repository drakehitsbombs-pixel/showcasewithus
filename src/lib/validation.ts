import { z } from "zod";

export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must be less than 100 characters" }),
});

export const briefSchema = z.object({
  projectType: z.enum(["wedding", "portrait", "product", "event"], {
    required_error: "Project type is required",
  }),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  city: z.string().max(100).optional(),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  moodTags: z.array(z.string()).max(10),
  lifestyle: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const messageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, { message: "Message cannot be empty" })
    .max(2000, { message: "Message must be less than 2000 characters" }),
});

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  city: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
});

export const creatorProfileSchema = z.object({
  priceBandLow: z.number().positive().optional(),
  priceBandHigh: z.number().positive().optional(),
  travelRadius: z.number().int().positive().max(500).optional(),
  styles: z.array(z.string()).max(10),
});

export const bookingSchema = z.object({
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format" }),
  slotStart: z.string().regex(/^\d{2}:\d{2}$/, { message: "Invalid start time format" }),
  slotEnd: z.string().regex(/^\d{2}:\d{2}$/, { message: "Invalid end time format" }),
  locationText: z.string().max(200, { message: "Location must be less than 200 characters" }).trim().optional(),
  notes: z.string().max(500, { message: "Notes must be less than 500 characters" }).trim().optional(),
});
