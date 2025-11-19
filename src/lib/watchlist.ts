import { supabase } from '@/config/supabase';
import type { TitleType } from '@/types';
import { enrichTitleWithGuardian } from './title-enrichment';

// Add title to watchlist
export async function addToWatchlist(
  userId: string,
  tmdbId: number,
  title: string,
  type: TitleType,
  releaseYear: number,
  posterUrl: string | null,
  overview: string
) {
  // Ensure user exists in public.users
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('users').upsert(
      {
        id: userId,
        email: user.email || '',
        display_name: user.user_metadata?.full_name || user.email || '',
      },
      {
        onConflict: 'id',
        ignoreDuplicates: true,
      }
    );
  }

  // First, upsert the title into titles table
  const { data: titleData, error: titleError } = await supabase
    .from('titles')
    .upsert(
      {
        tmdb_id: tmdbId,
        title,
        type,
        release_year: releaseYear,
        poster_url: posterUrl,
        overview,
      },
      {
        onConflict: 'tmdb_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (titleError) throw titleError;

  // Enrich with Guardian data in background (don't await - let it happen async)
  if (titleData && !titleData.guardian_last_checked) {
    enrichTitleWithGuardian(titleData.id, title, releaseYear).catch((error) => {
      console.error('Failed to enrich title with Guardian data:', error);
      // Don't throw - this is optional enrichment
    });
  }

  // Then add to watchlist
  const { error: watchlistError } = await supabase.from('watchlist').insert({
    user_id: userId,
    title_id: titleData.id,
    title_type: type,
  });

  if (watchlistError) {
    // Check if it's a duplicate error
    if (watchlistError.code === '23505') {
      throw new Error('Title already in watchlist');
    }
    throw watchlistError;
  }

  return titleData;
}

// Remove title from watchlist
export async function removeFromWatchlist(userId: string, titleId: string) {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('title_id', titleId);

  if (error) throw error;
}

// Get user's watchlist
export async function getWatchlist(userId: string, type?: TitleType) {
  // Get all watchlist items
  let query = supabase
    .from('watchlist')
    .select(
      `
      id,
      title_id,
      title_type,
      added_date,
      created_at,
      titles (
        id,
        tmdb_id,
        title,
        type,
        release_year,
        poster_url,
        overview,
        genres,
        guardian_rating,
        guardian_review_url
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('title_type', type);
  }

  const { data: watchlistData, error } = await query;
  if (error) throw error;

  // Get all watched title IDs for this type
  let watchHistoryQuery = supabase
    .from('watch_history')
    .select('title_id')
    .eq('user_id', userId);

  if (type) {
    watchHistoryQuery = watchHistoryQuery.eq('title_type', type);
  }

  const { data: watchedData } = await watchHistoryQuery;

  const watchedTitleIds = new Set(watchedData?.map((w) => w.title_id) || []);

  // Filter out items that are in watch history
  return watchlistData?.filter((item) => !watchedTitleIds.has(item.title_id)) || [];
}

// Check if title is in watchlist
export async function isInWatchlist(userId: string, tmdbId: number) {
  const { data, error } = await supabase
    .from('watchlist')
    .select('id, titles!inner(tmdb_id)')
    .eq('user_id', userId)
    .eq('titles.tmdb_id', tmdbId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
