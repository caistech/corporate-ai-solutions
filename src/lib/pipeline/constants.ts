export const SOURCES = [
  'cold_email_out',
  'cold_email_in',
  'linkedin',
  'referral',
  'portfolio_inbound',
  'event',
  'youtube',
  'podcast',
  'other',
  'connexions_platform_trust_sprint',
  'voice_intake',
] as const

export const SOURCE_LABELS: Record<(typeof SOURCES)[number], string> = {
  cold_email_out: 'Cold email out',
  cold_email_in: 'Cold email in',
  linkedin: 'LinkedIn',
  referral: 'Referral',
  portfolio_inbound: 'Portfolio inbound',
  event: 'Event',
  youtube: 'YouTube',
  podcast: 'Podcast',
  other: 'Other',
  connexions_platform_trust_sprint: 'Connexions — Platform Trust Sprint',
  voice_intake: 'Voice intake (Connexions)',
}

export const STATUSES = [
  'open',
  'active',
  'waiting_on_them',
  'waiting_on_me',
  'paused',
  'won',
  'lost',
  'archived',
] as const

export const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  open: 'Open',
  active: 'Active',
  waiting_on_them: 'Waiting on them',
  waiting_on_me: 'Waiting on me',
  paused: 'Paused',
  won: 'Won',
  lost: 'Lost',
  archived: 'Archived',
}

// Statuses that should never appear on /pipeline/today
export const DORMANT_STATUSES: ReadonlyArray<(typeof STATUSES)[number]> = [
  'paused',
  'won',
  'lost',
  'archived',
]

export const EVENT_TYPES = [
  'sent_email',
  'received_email',
  'linkedin_msg_sent',
  'linkedin_msg_received',
  'call',
  'meeting',
  'note',
  'task_done',
  'status_change',
  'connexions_intake_completed',
] as const

export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  sent_email: 'Sent email',
  received_email: 'Received email',
  linkedin_msg_sent: 'LinkedIn message sent',
  linkedin_msg_received: 'LinkedIn message received',
  call: 'Call',
  meeting: 'Meeting',
  note: 'Note',
  task_done: 'Task done',
  status_change: 'Status change',
  connexions_intake_completed: 'Connexions intake completed',
}

export const PRIORITIES = [1, 2, 3] as const
export const PRIORITY_LABELS: Record<(typeof PRIORITIES)[number], string> = {
  1: 'High',
  2: 'Mid',
  3: 'Low',
}
