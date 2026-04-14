import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykpjmvoyatcrkqyxbgfu.supabase.co';
const supabaseKey = '***REDACTED_SERVICE_KEY***';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking public.\"PGcode_problems\" columns...");
  const { data, error } = await supabase
    .from('PGcode_problems')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching problem:", error);
  } else {
    console.log("Columns found:", Object.keys(data[0] || {}));
    console.log("Sample row:", data[0]);
  }
}

checkSchema();
