// @explanatory-header-exempt — bare redirect to /pipeline/today; the entry-point header lives on that child surface
import { redirect } from 'next/navigation'

export default function PipelineRoot() {
  redirect('/pipeline/today')
}
