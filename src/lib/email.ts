import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NOTIFY_EMAIL = 'dennis@corporateaisolutions.com'

export async function notifySubmission(subject: string, fields: Record<string, string | undefined | null>) {
  const rows = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top">${k}</td><td style="padding:4px 0">${v}</td></tr>`)
    .join('')

  try {
    await resend.emails.send({
      from: 'Corporate AI <onboarding@resend.dev>',
      to: NOTIFY_EMAIL,
      subject,
      html: `<table style="font-family:sans-serif;font-size:14px">${rows}</table>`,
    })
  } catch (err) {
    console.error('Email notification failed:', err)
  }
}
