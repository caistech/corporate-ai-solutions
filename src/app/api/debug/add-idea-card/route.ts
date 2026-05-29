import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { product_slug, idea_card } = await request.json();
  
  if (!product_slug || !idea_card) {
    return NextResponse.json({ error: 'Missing product_slug or idea_card' }, { status: 400 });
  }
  
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('methodology_hypothesis_cards')
    .upsert({ 
      product_slug, 
      idea_card, 
      build_type: 'product',
      status: 'validation-in-flight'
    }, { onConflict: 'product_slug' })
    .select();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, data });
}
