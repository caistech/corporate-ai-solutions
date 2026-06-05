/**
 * /admin/pipeline/[productId] — Product Detail View (the card page).
 *
 * ONE-DOOR GUARD (memory project_one_door_card_access). The only way to a card is
 * onboarding/coach -> PASS the admit gate. A product is "admitted" iff
 * product_validation_status.is_draft = false (admit_product() is the only thing that flips it).
 * A Pending (is_draft = true) or unknown product is redirected to the coach — links AND typed
 * URLs both. This is the server-side teeth behind "cut every other link".
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import ProductDetailView from '@/components/admin/ProductDetailView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ProductDetailPage({
  params,
}: {
  params: { productId: string };
}) {
  const productId = params.productId;

  // Admission gate — only a coach/admit PASS (is_draft = false) opens the card.
  const supabase = supabaseAdmin();
  const { data: admission } = await supabase
    .from('product_validation_status')
    .select('is_draft')
    .eq('product_slug', productId)
    .maybeSingle();

  if (!admission || admission.is_draft) {
    // Pending or not-yet-an-idea → back to the one door (the coach / All-Ideas pile).
    redirect(`/admin/pipeline/new-ideas?pending=${encodeURIComponent(productId)}`);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/admin/pipeline" className="text-blue-400 hover:text-blue-300">
            Products
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-300 font-medium">{productId}</span>
        </nav>

        {/* Detail View */}
        <ProductDetailView productId={productId} />
      </div>
    </div>
  );
}
