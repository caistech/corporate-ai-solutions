// @explanatory-header-exempt — Pipeline/methodology surface slated for extraction to its own product (docs/PIPELINE_SEPARATION_PLAN.md); a proper <ExplanatoryHeader/> lands in that rewrite, not the cost-dashboard PR.
import { redirect } from 'next/navigation'

// Retired: the admin login moved to the standard /admin/login (PRODUCT_STANDARDS §8.5).
// This stub keeps old links/bookmarks working by redirecting to the canonical entry.
export default function AdminPipelineLoginRedirect() {
  redirect('/admin/login')
}
