'use client'

import { ContactForm } from '@/components/pipeline/ContactForm'
import { updateContact } from '@/lib/pipeline/actions/contacts'
import type { Contact } from '@/lib/pipeline/types'

export function EditContactForm({ contact }: { contact: Contact }) {
  return (
    <ContactForm
      mode="edit"
      initial={contact}
      onSubmit={(input) => updateContact(contact.id, input)}
      redirectPath={() => `/pipeline/contacts/${contact.id}`}
    />
  )
}
