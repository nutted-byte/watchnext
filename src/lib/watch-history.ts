import { supabase } from '@/config/supabase';
import type { TitleType } from '@/types';

// Mark title as watched (with rating)
export async function markAsWatched(
  userId: string,
  tmdbId: number,
  title: string,
  type: TitleType,
  releaseYear: number,
  posterUrl: string | null,
  overview: string,
  rating: number,
  notes?: string
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

  // Remove from watchlist if it exists
  await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('title_id', titleData.id);

  // Add to watch history
  const { error: historyError } = await supabase.from('watch_history').upsert(
    {
      user_id: userId,
      title_id: titleData.id,
      title_type: type,
      rating,
      notes: notes || null,
    },
    {
      onConflict: 'user_id,title_id',
      ignoreDuplicates: false,
    }
  );

  if (historyError) throw historyError;

  return titleData;
}

// Update rating/notes for watched title
export async function updateWatchHistory(
  userId: string,
  titleId: string,
  rating: number,
  notes?: string
) {
  const { error } = await supabase
    .from('watch_history')
    .update({
      rating,
      notes: notes || null,
    })
    .eq('user_id', userId)
    .eq('title_id', titleId);

  if (error) throw error;
}

// Remove from watch history
export async function removeFromHistory(userId: string, titleId: string) {
  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('user_id', userId)
    .eq('title_id', titleId);

  if (error) throw error;
}

// Get user's watch history
export async function getWatchHistory(userId: string, type?: TitleType) {
  let query = supabase
    .from('watch_history')
    .select(
      `
      id,
      title_id,
      title_type,
      watched_date,
      rating,
      notes,
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
    .order('watched_date', { ascending: false });

  if (type) {
    query = query.eq('title_type', type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Check if title is in watch history
export async function isWatched(userId: string, tmdbId: number) {
  const { data, error } = await supabase
    .from('watch_history')
    .select('id, rating, titles!inner(tmdb_id)')
    .eq('user_id', userId)
    .eq('titles.tmdb_id', tmdbId)
    .maybeSingle();

  if (error) throw error;
  return data ? { watched: true, rating: data.rating } : { watched: false };
}
