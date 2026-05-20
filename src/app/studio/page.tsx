// @explanatory-header-exempt — bare redirect to /studio/thesis; the entry-point header lives on that child surface
import { redirect } from 'next/navigation'

export default function StudioPage() {
  redirect('/studio/thesis')
}
