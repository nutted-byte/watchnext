import { supabase } from '@/config/supabase';
import type { TitleType } from '@/types';

// Dismiss a recommendation
export async function dismissRecommendation(
  userId: string,
  tmdbId: number,
  title: string,
  type: TitleType,
  releaseYear: number,
  posterUrl: string | null,
  overview: string
) {
  // First, ensure the title exists in the titles table
  const { data: existingTitle } = await supabase
    .from('titles')
    .select('id')
    .eq('tmdb_id', tmdbId)
    .maybeSingle();

  let titleId: string;

  if (existingTitle) {
    titleId = existingTitle.id;
  } else {
    // Create the title if it doesn't exist
    const { data: newTitle, error: titleError } = await supabase
      .from('titles')
      .insert({
        tmdb_id: tmdbId,
        title,
        type,
        release_year: releaseYear,
        poster_url: posterUrl,
        overview,
      })
      .select()
      .single();

    if (titleError) throw titleError;
    titleId = newTitle.id;
  }

  // Add to dismissed_recommendations
  const { error } = await supabase
    .from('dismissed_recommendations')
    .insert({
      user_id: userId,
      title_id: titleId,
      tmdb_id: tmdbId,
      title_type: type,
    });

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation - already dismissed
      throw new Error('Already dismissed');
    }
    throw error;
  }
}

// Get dismissed recommendation IDs for a user
export async function getDismissedRecommendations(userId: string, type?: TitleType) {
  const query = supabase
    .from('dismissed_recommendations')
    .select('tmdb_id')
    .eq('user_id', userId);

  if (type) {
    query.eq('title_type', type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Un-dismiss a recommendation (optional - for future use)
export async function undismissRecommendation(userId: string, tmdbId: number) {
  const { error } = await supabase
    .from('dismissed_recommendations')
    .delete()
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId);

  if (error) throw error;
}
