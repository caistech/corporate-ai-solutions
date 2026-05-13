import { z } from 'zod'
import { SOURCES, STATUSES, EVENT_TYPES, PRIORITIES } from './constants'

// ============================================================
// Base schemas (mirror the DB row shape)
// ============================================================

export const ContactSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().nullable().optional(),
  linkedin_url: z.string().url().nullable().optional(),
  company: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  source: z.enum(SOURCES),
  what_they_want: z.string().nullable().optional(),
  what_i_want: z.string().nullable().optional(),
  status: z.enum(STATUSES).default('open'),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  next_action: z.string().nullable().optional(),
  next_action_due: z.string().nullable().optional(), // ISO date YYYY-MM-DD
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Contact = z.infer<typeof ContactSchema>

// Create input: omit server-managed fields. Email/LinkedIn URL accept empty strings (coerce to null).
const optionalString = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v === '' || v == null ? null : v))

const optionalEmail = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v === '' || v == null ? null : v))
  .refine((v) => v === null || z.string().email().safeParse(v).success, {
    message: 'Invalid email',
  })

const optionalUrl = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v === '' || v == null ? null : v))
  .refine((v) => v === null || z.string().url().safeParse(v).success, {
    message: 'Invalid URL',
  })

export const CreateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: optionalEmail,
  linkedin_url: optionalUrl,
  company: optionalString,
  role: optionalString,
  source: z.enum(SOURCES),
  what_they_want: optionalString,
  what_i_want: optionalString,
  status: z.enum(STATUSES).default('open'),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  next_action: optionalString,
  next_action_due: optionalString,
  notes: optionalString,
  tags: z.array(z.string()).default([]),
})

export type CreateContactInput = z.input<typeof CreateContactSchema>

// Update patch: omit id, owner_id, created_at, updated_at. All fields optional.
// This is the load-bearing safety boundary — see directive 3.5.
export const UpdateContactSchema = CreateContactSchema.partial()
export type UpdateContactInput = z.input<typeof UpdateContactSchema>

// ============================================================
// Events
// ============================================================

export const EventSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  event_type: z.enum(EVENT_TYPES),
  summary: z.string().min(1),
  body: z.string().nullable().optional(),
  occurred_at: z.string(),
  created_at: z.string(),
})

export type Event = z.infer<typeof EventSchema>

export const CreateEventSchema = z.object({
  event_type: z.enum(EVENT_TYPES),
  summary: z.string().min(1, 'Summary is required').max(500),
  body: optionalString,
  occurred_at: z.string().optional(), // defaults to now() at DB layer
})

export type CreateEventInput = z.input<typeof CreateEventSchema>

export const UpdateEventSchema = CreateEventSchema.partial()
export type UpdateEventInput = z.input<typeof UpdateEventSchema>

// ============================================================
// Action result wrapper
// ============================================================

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
