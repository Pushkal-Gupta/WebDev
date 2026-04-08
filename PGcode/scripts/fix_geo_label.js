import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykpjmvoyatcrkqyxbgfu.supabase.co';
// Using the service key shared by user
const supabaseKey = '***REDACTED_SERVICE_KEY***';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLabels() {
  console.log("Updating 'Geo' to 'Geometry'...");
  const { data, error } = await supabase
    .from('PGcode_topics')
    .update({ name: 'Geometry' })
    .eq('id', 'geometry');

  if (error) {
    console.error("Error updating label:", error);
  } else {
    console.log("Successfully updated label!");
  }
}

fixLabels();
