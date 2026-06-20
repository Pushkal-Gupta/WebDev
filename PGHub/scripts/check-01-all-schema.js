import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykpjmvoyatcrkqyxbgfu.supabase.co';
const supabaseKey = '***REDACTED_SERVICE_KEY***';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
  console.log("Checking topics...");
  const { data: topics } = await supabase.from('PGcode_topics').select('*').limit(1);
  console.log("Topic Columns:", Object.keys(topics[0] || {}));

  console.log("Checking problems...");
  const { data: problems } = await supabase.from('PGcode_problems').select('*').limit(1);
  console.log("Problem Columns:", Object.keys(problems[0] || {}));
}

checkAll();
