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

async function clearAllGuardianCache() {
  console.log('Clearing ALL Guardian review cache from titles table...');

  // First check what's there
  const { data: before } = await supabase
    .from('titles')
    .select('tmdb_id, title, type, guardian_rating, guardian_review_url')
    .not('guardian_rating', 'is', null);

  console.log(`\nFound ${before?.length || 0} titles with Guardian data`);

  if (before && before.length > 0) {
    console.log('\nSample of existing data:');
    before.slice(0, 5).forEach(t => {
      console.log(`  - ${t.title} (${t.type}): ${t.guardian_review_url}`);
    });
  }

  // Clear all Guardian data
  const { data, error } = await supabase
    .from('titles')
    .update({
      guardian_rating: null,
      guardian_review_url: null,
      guardian_review_excerpt: null,
    })
    .not('guardian_rating', 'is', null)
    .select();

  if (error) {
    console.error('Error clearing Guardian data:', error);
    process.exit(1);
  }

  console.log(`\n✓ Cleared Guardian data for ${data?.length || 0} titles`);
  console.log('Guardian reviews will be re-fetched with correct section filtering on next recommendation request');
  process.exit(0);
}

clearAllGuardianCache();
