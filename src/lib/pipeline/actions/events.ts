'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/pipeline/supabase-server'
import {
  CreateEventSchema,
  UpdateEventSchema,
  type ActionResult,
  type Event,
} from '@/lib/pipeline/types'

function fromZodError(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root'
    fieldErrors[key] = fieldErrors[key] ?? []
    fieldErrors[key].push(issue.message)
  }
  return { ok: false, error: 'Validation failed', fieldErrors }
}

export async function logEvent(
  contactId: string,
  input: unknown
): Promise<ActionResult<Event>> {
  if (!z.string().uuid().safeParse(contactId).success) {
    return { ok: false, error: 'Invalid contact id' }
  }
  const parsed = CreateEventSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  const supabase = createClient()
  const { data, error } = await supabase
    .schema('pipeline')
    .from('events')
    .insert({ ...parsed.data, contact_id: contactId })
    .select()
    .single()

  if (error) {
    console.error('logEvent:', error)
    return { ok: false, error: error.message }
  }

  revalidatePath(`/pipeline/contacts/${contactId}`)
  revalidatePath('/pipeline/today')
  return { ok: true, data: data as Event }
}

export async function updateEvent(
  id: string,
  patch: unknown
): Promise<ActionResult<Event>> {
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Invalid event id' }
  }
  const parsed = UpdateEventSchema.safeParse(patch)
  if (!parsed.success) return fromZodError(parsed.error)

  const supabase = createClient()
  const { data, error } = await supabase
    .schema('pipeline')
    .from('events')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateEvent:', error)
    return { ok: false, error: error.message }
  }

  if (data?.contact_id) {
    revalidatePath(`/pipeline/contacts/${data.contact_id}`)
  }
  return { ok: true, data: data as Event }
}

export async function deleteEvent(id: string): Promise<ActionResult<true>> {
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Invalid event id' }
  }

  const supabase = createClient()
  const { data: prev } = await supabase
    .schema('pipeline')
    .from('events')
    .select('contact_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .schema('pipeline')
    .from('events')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteEvent:', error)
    return { ok: false, error: error.message }
  }

  if (prev?.contact_id) {
    revalidatePath(`/pipeline/contacts/${prev.contact_id}`)
  }
  return { ok: true, data: true }
}
