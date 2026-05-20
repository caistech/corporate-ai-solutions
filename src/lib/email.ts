import { Resend } from 'resend'

// Per the global CLAUDE.md email infrastructure rule: every notification email
// goes from the only Resend-verified sender domain for this portfolio,
// `updates.corporateaisolutions.com`. From and to addresses are env-overridable
// so the operator can point notifications wherever (and so other projects
// consuming this lib can configure separately) without redeploying code.
const DEFAULT_FROM = 'Corporate AI Solutions <noreply@updates.corporateaisolutions.com>'
const DEFAULT_NOTIFY_TO = 'dennis@corporateaisolutions.com'

export async function notifySubmission(subject: string, fields: Record<string, string | undefined | null>) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email notification')
    return
  }
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM
  const to = process.env.NOTIFY_EMAIL || DEFAULT_NOTIFY_TO
  const resend = new Resend(apiKey)

  const rows = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top">${k}</td><td style="padding:4px 0">${v}</td></tr>`)
    .join('')

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html: `<table style="font-family:sans-serif;font-size:14px">${rows}</table>`,
    })
  } catch (err) {
    console.error('Email notification failed:', err)
  }
}
