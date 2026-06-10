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

export interface LowBalanceSource {
  provider: string
  name: string
  balanceUsd: number
  thresholdUsd: number
}

function fmtUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

/**
 * Email the admin that one or more cost sources have dropped below their alert threshold.
 * Sent from the same verified Resend sender as other portfolio notifications.
 *
 * Returns TRUE only when the email was actually accepted by Resend, FALSE when it was skipped
 * (no key / empty input) or failed. Callers use this to decide whether to set the debounce
 * latch — never suppress retries for an alert that didn't send.
 */
export async function sendLowBalanceAlert(sources: LowBalanceSource[]): Promise<boolean> {
  if (sources.length === 0) return false

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[low-balance-alert] RESEND_API_KEY not set — skipping email', sources)
    return false
  }
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM
  const to = process.env.NOTIFY_EMAIL || DEFAULT_NOTIFY_TO
  const resend = new Resend(apiKey)

  const rows = sources
    .map(
      (s) =>
        `<tr><td style="padding:6px 16px 6px 0;font-weight:600">${s.name} <span style="color:#888;font-weight:400">(${s.provider})</span></td>` +
        `<td style="padding:6px 16px 6px 0;color:#b91c1c;font-weight:600">${fmtUsd(s.balanceUsd)}</td>` +
        `<td style="padding:6px 0;color:#666">threshold ${fmtUsd(s.thresholdUsd)}</td></tr>`,
    )
    .join('')

  const subject =
    sources.length === 1
      ? `⚠️ Low balance: ${sources[0].name} (${fmtUsd(sources[0].balanceUsd)})`
      : `⚠️ Low balance on ${sources.length} cost sources`

  const html = `
    <div style="font-family:sans-serif;font-size:14px;color:#111">
      <p>The following cost ${sources.length === 1 ? 'source has' : 'sources have'} dropped below the configured alert threshold. Top up before they run out.</p>
      <table style="border-collapse:collapse;margin-top:8px">${rows}</table>
      <p style="margin-top:16px;color:#666">View all balances in the Ops Center → /admin/ops</p>
    </div>`

  try {
    await resend.emails.send({ from, to, subject, html })
    console.log(`[low-balance-alert] Sent alert for ${sources.length} source(s)`)
    return true
  } catch (err) {
    console.error('[low-balance-alert] Email failed:', err)
    return false
  }
}
