import { redirect } from 'next/navigation'

// Retired: the admin login moved to the standard /admin/login (PRODUCT_STANDARDS §8.5).
// This stub keeps old links/bookmarks working by redirecting to the canonical entry.
export default function AdminPipelineLoginRedirect() {
  redirect('/admin/login')
}
