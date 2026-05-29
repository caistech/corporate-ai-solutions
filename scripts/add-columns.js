const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azelomanmlywwzbpkksy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6ZWxvbWFubWx5d3d6YnBra3N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MjkzMiwiZXhwIjoyMDkxNTQ4OTMyfQ.EKkOhUPHmnAFJq6aC0nqDjp0bD0LwxaYdm3P0Njn93g'
);

const sql = `
ALTER TABLE products ADD COLUMN IF NOT EXISTS landing_page_url TEXT;
`;

console.log('Note: Cannot run raw SQL from client. Need to run migration via Supabase dashboard or CLI.');
console.log('Manual fix needed in InvestorPilot Supabase dashboard:');
console.log(sql);
