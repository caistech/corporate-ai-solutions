'use client'

import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  /** Body lines — each is rendered as its own paragraph so consequences read clearly. */
  body: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** 'danger' tints the confirm button red (irreversible actions); 'primary' uses the accent. */
  tone?: 'primary' | 'danger'
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Styled in-app confirm modal. Used before any consequential action in the
 * cockpit — real-research launch (incurs real discovery) and irreversible
 * decisions (KILL). Full-screen sheet on mobile, centred dialog on laptop.
 * Closes on Escape / backdrop click (cancel only); focus lands on Cancel so a
 * stray Enter doesn't fire the consequence.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, pending, onCancel])

  if (!open) return null

  const confirmClasses =
    tone === 'danger'
      ? 'bg-red-500 text-white hover:bg-red-600'
      : 'bg-accent text-black hover:bg-accent/90'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={() => {
        if (!pending) onCancel()
      }}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl border border-gray-border bg-gray-dark p-6 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <div className="mt-3 space-y-2 text-sm text-gray-light">{body}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="min-h-[44px] w-full rounded-lg border border-gray-border bg-black/20 px-4 py-2 text-sm text-gray-light transition-colors hover:border-accent disabled:opacity-50 sm:w-auto"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`min-h-[44px] w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 sm:w-auto ${confirmClasses}`}
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
