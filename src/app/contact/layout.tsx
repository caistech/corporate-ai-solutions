import type { Metadata } from 'next'

/**
 * `/contact` renders as a client component (it reads search params to pre-set the enquiry type), so
 * it cannot export `metadata` itself. Without this layout it inherited the root title verbatim, and
 * an audit found `/contact` and `/` sharing one identical `<title>` — a person with several tabs open
 * cannot tell which is which.
 */
export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Book a 15-minute call, or send an enquiry about an Opportunity Audit or Deployment Sprint. Brisbane, Queensland.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
