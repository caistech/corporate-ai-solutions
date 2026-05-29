require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addSingify() {
  // Check if exists
  const { data: existing } = await supabase
    .from('product_validation_status')
    .select('product_slug')
    .eq('product_slug', 'singify');

  if (existing && existing.length > 0) {
    console.log('Singify already exists');
    return;
  }

  // Insert with all required fields
  const { error } = await supabase
    .from('product_validation_status')
    .insert({
      product_slug: 'singify',
      display_name: 'Singify',
      has_promise: false,
      has_distributor: false,
      has_end_user: false,
      has_friction: false,
      has_methodology_commitment: false,
      gate1_ready: false,
      can_run_outreach: false,
      hard_gates_passed: 0,
      hard_gates_total: 0,
      validation_test_status: 'not_run',
      is_draft: true,
      is_paused: false,
      last_scoring_run: new Date().toISOString(),
    });

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Singify added to pipeline!');
  }
}

addSingify();
