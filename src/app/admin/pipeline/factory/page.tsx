// @explanatory-header-exempt — Pipeline/methodology surface slated for extraction to its own product (docs/PIPELINE_SEPARATION_PLAN.md); a proper <ExplanatoryHeader/> lands in that rewrite, not the cost-dashboard PR.
import { redirect } from 'next/navigation'

export default function FactoryRedirect() {
  redirect('/admin/pipeline')
}
