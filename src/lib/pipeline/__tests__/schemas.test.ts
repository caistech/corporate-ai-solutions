import { describe, expect, it } from 'vitest'
import {
  CreateContactSchema,
  UpdateContactSchema,
  CreateEventSchema,
  UpdateEventSchema,
} from '../types'

describe('CreateContactSchema', () => {
  it('accepts minimum required fields', () => {
    const r = CreateContactSchema.safeParse({
      name: 'Test',
      source: 'linkedin',
    })
    expect(r.success).toBe(true)
  })

  it('rejects empty name', () => {
    const r = CreateContactSchema.safeParse({ name: '', source: 'linkedin' })
    expect(r.success).toBe(false)
  })

  it('rejects invalid source', () => {
    const r = CreateContactSchema.safeParse({ name: 'A', source: 'unknown' })
    expect(r.success).toBe(false)
  })

  it('coerces empty email string to null', () => {
    const r = CreateContactSchema.safeParse({
      name: 'A',
      source: 'linkedin',
      email: '',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBeNull()
  })

  it('rejects invalid email when provided', () => {
    const r = CreateContactSchema.safeParse({
      name: 'A',
      source: 'linkedin',
      email: 'not-an-email',
    })
    expect(r.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const r = CreateContactSchema.safeParse({
      name: 'A',
      source: 'linkedin',
      status: 'invalid',
    })
    expect(r.success).toBe(false)
  })

  it('rejects priority outside 1/2/3', () => {
    const r = CreateContactSchema.safeParse({
      name: 'A',
      source: 'linkedin',
      priority: 5,
    })
    expect(r.success).toBe(false)
  })
})

describe('UpdateContactSchema — security boundary', () => {
  it('does not include id', () => {
    expect('id' in UpdateContactSchema.shape).toBe(false)
  })

  it('does not include owner_id', () => {
    expect('owner_id' in UpdateContactSchema.shape).toBe(false)
  })

  it('does not include created_at', () => {
    expect('created_at' in UpdateContactSchema.shape).toBe(false)
  })

  it('does not include updated_at', () => {
    expect('updated_at' in UpdateContactSchema.shape).toBe(false)
  })

  it('strips unknown keys silently (object .partial())', () => {
    // .partial() doesn't strict-strip by default; verify owner_id is ignored
    const r = UpdateContactSchema.safeParse({
      name: 'A',
      owner_id: '00000000-0000-0000-0000-000000000001',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect((r.data as Record<string, unknown>).owner_id).toBeUndefined()
    }
  })

  it('accepts a partial patch', () => {
    const r = UpdateContactSchema.safeParse({ status: 'won' })
    expect(r.success).toBe(true)
  })
})

describe('CreateEventSchema', () => {
  it('requires event_type and summary', () => {
    expect(CreateEventSchema.safeParse({}).success).toBe(false)
    expect(
      CreateEventSchema.safeParse({ event_type: 'note', summary: 'hi' }).success
    ).toBe(true)
  })

  it('rejects invalid event_type', () => {
    const r = CreateEventSchema.safeParse({ event_type: 'tweet', summary: 'x' })
    expect(r.success).toBe(false)
  })
})

describe('UpdateEventSchema — security boundary', () => {
  it('does not include id', () => {
    expect('id' in UpdateEventSchema.shape).toBe(false)
  })

  it('does not include owner_id', () => {
    expect('owner_id' in UpdateEventSchema.shape).toBe(false)
  })

  it('does not include contact_id', () => {
    expect('contact_id' in UpdateEventSchema.shape).toBe(false)
  })

  it('strips unknown keys silently', () => {
    const r = UpdateEventSchema.safeParse({
      summary: 'updated',
      contact_id: '00000000-0000-0000-0000-000000000001',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect((r.data as Record<string, unknown>).contact_id).toBeUndefined()
    }
  })
})
