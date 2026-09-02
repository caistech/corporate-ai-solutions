// @explanatory-header-exempt — the page opens with an interactive hand-built hero that answers what/what-to-do/why and immediately offers the compile action
import { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { Infera } from '@/components/compiler/Infera'

const DESCRIPTION =
  'Turn an agentic AI solution into a standardised, provider-neutral workload model — without asking the developer to estimate token usage. Compile the workload, run it across latency vs batching scenarios, and get a defensible cost figure to quote your client. Functional prototype — join the waitlist.'

export const metadata: Metadata = {
  title: 'Infera',
  description: DESCRIPTION,
  openGraph: {
    title: 'Infera | ' + SITE.name,
    description: DESCRIPTION,
  },
  twitter: {
    title: 'Infera | ' + SITE.name,
    description: DESCRIPTION,
  },
}

export default function InferaPage() {
  return <Infera />
}