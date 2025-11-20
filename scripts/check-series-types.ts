import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeriesTypes() {
  console.log('Checking title types in database...');

  // Check all unique type values
  const { data: types, error: typesError } = await supabase
    .from('titles')
    .select('type')
    .not('guardian_rating', 'is', null);

  if (typesError) {
    console.error('Error:', typesError);
    process.exit(1);
  }

  const uniqueTypes = [...new Set(types?.map(t => t.type) || [])];
  console.log('Unique type values with Guardian ratings:', uniqueTypes);

  // Check count by type
  for (const type of uniqueTypes) {
    const { data, error } = await supabase
      .from('titles')
      .select('tmdb_id, title, guardian_rating, guardian_review_url')
      .eq('type', type)
      .not('guardian_rating', 'is', null);

    if (!error && data) {
      console.log(`\nType: "${type}" - ${data.length} titles with Guardian ratings`);
      if (data.length > 0) {
        console.log('Sample:', data[0].title, '-', data[0].guardian_review_url);
      }
    }
  }

  process.exit(0);
}

checkSeriesTypes();
