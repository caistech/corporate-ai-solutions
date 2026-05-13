'use client'

import { useState } from 'react'
import { ContactCard } from './ContactCard'
import type { Contact } from '@/lib/pipeline/types'

type Section = {
  id: string
  title: string
  tone: 'red' | 'orange' | 'neutral' | 'muted'
  contacts: Contact[]
  collapsedByDefault?: boolean
}

const TONE_HEADER: Record<Section['tone'], string> = {
  red: 'text-[#FF6B35]',
  orange: 'text-[#F7B500]',
  neutral: 'text-[#1E5AA8]',
  muted: 'text-[#5C6B7A]',
}

export function TodayList({ sections }: { sections: Section[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(
    new Set(sections.filter((s) => s.collapsedByDefault).map((s) => s.id))
  )

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        if (section.contacts.length === 0) return null
        const isCollapsed = collapsed.has(section.id)
        return (
          <section key={section.id}>
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center justify-between mb-3 text-left"
            >
              <h2 className={`text-sm font-bold uppercase tracking-wide ${TONE_HEADER[section.tone]}`}>
                {section.title} <span className="text-[#5C6B7A] font-normal ml-1">({section.contacts.length})</span>
              </h2>
              <span className="text-xs text-[#5C6B7A]">{isCollapsed ? 'Show' : 'Hide'}</span>
            </button>
            {!isCollapsed && (
              <div className="space-y-2">
                {section.contacts.map((c) => (
                  <ContactCard key={c.id} contact={c} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
