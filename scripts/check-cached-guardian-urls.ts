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

async function checkCachedGuardianUrls() {
  console.log('Checking cached Guardian URLs...\n');

  // Get all titles with Guardian data
  const { data: titles, error } = await supabase
    .from('titles')
    .select('tmdb_id, title, type, guardian_rating, guardian_review_url')
    .not('guardian_rating', 'is', null)
    .order('title');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  if (!titles || titles.length === 0) {
    console.log('No cached Guardian data found');
    process.exit(0);
  }

  console.log(`Found ${titles.length} titles with Guardian data:\n`);

  // Group by type
  const films = titles.filter(t => t.type === 'film');
  const series = titles.filter(t => t.type === 'series');
  const other = titles.filter(t => t.type !== 'film' && t.type !== 'series');

  if (films.length > 0) {
    console.log(`\n📽️  FILMS (${films.length}):`);
    films.forEach(t => {
      console.log(`  ${t.title}: ${t.guardian_review_url}`);
    });
  }

  if (series.length > 0) {
    console.log(`\n📺 SERIES (${series.length}):`);
    series.forEach(t => {
      const urlType = t.guardian_review_url?.includes('/film/') ? '❌ FILM URL!' :
                      t.guardian_review_url?.includes('/tv-and-radio/') ? '✅ TV URL' : '❓ Other';
      console.log(`  ${t.title}: ${urlType}`);
      console.log(`     ${t.guardian_review_url}`);
    });
  }

  if (other.length > 0) {
    console.log(`\n❓ OTHER (${other.length}):`);
    other.forEach(t => {
      console.log(`  ${t.title} (${t.type}): ${t.guardian_review_url}`);
    });
  }

  process.exit(0);
}

checkCachedGuardianUrls();
