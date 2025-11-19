import { supabase } from '@/config/supabase';
import { getBestGuardianReview } from './guardian';

// Enrich a title with Guardian review data
export async function enrichTitleWithGuardian(
  titleId: string,
  titleName: string,
  releaseYear?: number
) {
  try {
    const guardianData = await getBestGuardianReview(titleName, releaseYear);

    // Update title in database
    const { error } = await supabase
      .from('titles')
      .update({
        guardian_review_url: guardianData.url,
        guardian_rating: guardianData.rating,
        guardian_review_excerpt: guardianData.excerpt,
        guardian_last_checked: new Date().toISOString(),
      })
      .eq('id', titleId);

    if (error) {
      console.error('Error updating title with Guardian data:', error);
      throw error;
    }

    return guardianData;
  } catch (error) {
    console.error('Error enriching title:', error);
    throw error;
  }
}

// Check if title needs Guardian data refresh (older than 30 days)
export function needsGuardianRefresh(lastChecked: string | null): boolean {
  if (!lastChecked) return true;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return new Date(lastChecked) < thirtyDaysAgo;
}
