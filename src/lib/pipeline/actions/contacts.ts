'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/pipeline/supabase-server'
import {
  CreateContactSchema,
  UpdateContactSchema,
  type ActionResult,
  type Contact,
} from '@/lib/pipeline/types'
import { STATUSES } from '@/lib/pipeline/constants'

function revalidate() {
  revalidatePath('/pipeline/today')
  revalidatePath('/pipeline/contacts')
}

function fromZodError(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root'
    fieldErrors[key] = fieldErrors[key] ?? []
    fieldErrors[key].push(issue.message)
  }
  return { ok: false, error: 'Validation failed', fieldErrors }
}

export async function createContact(
  input: unknown
): Promise<ActionResult<Contact>> {
  const parsed = CreateContactSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  const supabase = createClient()
  const { data, error } = await supabase
    .schema('pipeline')
    .from('contacts')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    console.error('createContact:', error)
    return { ok: false, error: error.message }
  }

  revalidate()
  return { ok: true, data: data as Contact }
}

export async function updateContact(
  id: string,
  patch: unknown
): Promise<ActionResult<Contact>> {
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Invalid contact id' }
  }
  const parsed = UpdateContactSchema.safeParse(patch)
  if (!parsed.success) return fromZodError(parsed.error)

  const supabase = createClient()
  const { data, error } = await supabase
    .schema('pipeline')
    .from('contacts')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateContact:', error)
    return { ok: false, error: error.message }
  }

  revalidate()
  revalidatePath(`/pipeline/contacts/${id}`)
  return { ok: true, data: data as Contact }
}

export async function deleteContact(id: string): Promise<ActionResult<true>> {
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Invalid contact id' }
  }

  const supabase = createClient()
  const { error } = await supabase
    .schema('pipeline')
    .from('contacts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteContact:', error)
    return { ok: false, error: error.message }
  }

  revalidate()
  return { ok: true, data: true }
}

const NextActionSchema = z.object({
  next_action: z.string().nullable().optional(),
  next_action_due: z.string().nullable().optional(),
})

export async function updateNextAction(
  id: string,
  input: unknown
): Promise<ActionResult<Contact>> {
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Invalid contact id' }
  }
  const parsed = NextActionSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  return updateContact(id, parsed.data)
}

export async function changeStatus(
  id: string,
  status: string
): Promise<ActionResult<Contact>> {
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Invalid contact id' }
  }
  const statusParse = z.enum(STATUSES).safeParse(status)
  if (!statusParse.success) {
    return { ok: false, error: 'Invalid status' }
  }

  const supabase = createClient()

  const { data: prev } = await supabase
    .schema('pipeline')
    .from('contacts')
    .select('status')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .schema('pipeline')
    .from('contacts')
    .update({ status: statusParse.data })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('changeStatus:', error)
    return { ok: false, error: error.message }
  }

  // Auto-log a status_change event for the audit trail
  if (prev && prev.status !== statusParse.data) {
    await supabase
      .schema('pipeline')
      .from('events')
      .insert({
        contact_id: id,
        event_type: 'status_change',
        summary: `Status: ${prev.status} → ${statusParse.data}`,
      })
  }

  revalidate()
  revalidatePath(`/pipeline/contacts/${id}`)
  return { ok: true, data: data as Contact }
}

export async function addTag(
  id: string,
  tag: string
): Promise<ActionResult<Contact>> {
  const tagParse = z.string().min(1).max(50).safeParse(tag)
  if (!tagParse.success) return { ok: false, error: 'Invalid tag' }
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Invalid contact id' }
  }

  const supabase = createClient()
  const { data: current } = await supabase
    .schema('pipeline')
    .from('contacts')
    .select('tags')
    .eq('id', id)
    .single()

  const currentTags: string[] = current?.tags ?? []
  if (currentTags.includes(tagParse.data)) {
    return { ok: false, error: 'Tag already present' }
  }

  const next = [...currentTags, tagParse.data]
  return updateContact(id, { tags: next })
}

export async function removeTag(
  id: string,
  tag: string
): Promise<ActionResult<Contact>> {
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Invalid contact id' }
  }

  const supabase = createClient()
  const { data: current } = await supabase
    .schema('pipeline')
    .from('contacts')
    .select('tags')
    .eq('id', id)
    .single()

  const currentTags: string[] = current?.tags ?? []
  const next = currentTags.filter((t) => t !== tag)
  return updateContact(id, { tags: next })
}
