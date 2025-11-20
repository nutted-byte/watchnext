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

async function clearSeriesGuardianData() {
  console.log('Clearing Guardian data for series...');

  const { data, error } = await supabase
    .from('titles')
    .update({
      guardian_rating: null,
      guardian_review_url: null,
      guardian_review_excerpt: null,
    })
    .eq('type', 'series')
    .select();

  if (error) {
    console.error('Error clearing Guardian data:', error);
    process.exit(1);
  }

  console.log(`✓ Cleared Guardian data for ${data?.length || 0} series titles`);
  console.log('Guardian reviews will be re-fetched on next recommendation request');
  process.exit(0);
}

clearSeriesGuardianData();
