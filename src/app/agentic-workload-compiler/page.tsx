// @explanatory-header-exempt — the page opens with an interactive hand-built hero that answers what/what-to-do/why and immediately offers the compile action
import { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { AgenticWorkloadCompiler } from '@/components/compiler/AgenticWorkloadCompiler'

const DESCRIPTION =
  'Turn an agentic AI solution into a standardised, provider-neutral workload model — without asking the developer to estimate token usage. Functional prototype.'

export const metadata: Metadata = {
  title: 'Agentic Workload Compiler',
  description: DESCRIPTION,
  openGraph: {
    title: 'Agentic Workload Compiler | ' + SITE.name,
    description: DESCRIPTION,
  },
  twitter: {
    title: 'Agentic Workload Compiler | ' + SITE.name,
    description: DESCRIPTION,
  },
}

export default function AgenticWorkloadCompilerPage() {
  return <AgenticWorkloadCompiler />
}