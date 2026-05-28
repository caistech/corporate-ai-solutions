// @explanatory-header-exempt — bare redirect to /pipeline/welcome; the landing page is the entry point for visitors
import { redirect } from 'next/navigation'

export default function PipelineRoot() {
  redirect('/pipeline/welcome')
}
