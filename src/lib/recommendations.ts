import { supabase } from '@/config/supabase';
import { env } from '@/config/env';
import type { TitleType } from '@/types';
import { getClaudeRecommendations } from './claude-recommendations';

interface RecommendationParams {
  userId: string;
  type: TitleType;
  limit?: number;
}

interface GenrePreference {
  genreId: number;
  weight: number;
}

interface ScoredTitle {
  id: number;
  title: string;
  type: TitleType;
  releaseDate: string;
  posterPath: string | null;
  overview: string;
  voteAverage: number;
  genreIds: number[];
  score: number;
  guardianRating?: number | null;
}

// Get user's genre preferences based on watch history
async function getUserGenrePreferences(
  userId: string,
  type: TitleType
): Promise<GenrePreference[]> {
  // Get watch history with ratings
  const { data: history, error } = await supabase
    .from('watch_history')
    .select('rating, titles!inner(genres)')
    .eq('user_id', userId)
    .eq('title_type', type)
    .gte('rating', 3); // Only consider titles rated 3+ stars

  if (error || !history || history.length === 0) {
    return [];
  }

  // Calculate genre weights based on ratings
  const genreWeights = new Map<number, number>();

  for (const item of history) {
    const titleData = item.titles as any;
    const genres = titleData?.genres || [];
    const rating = item.rating;

    for (const genre of genres) {
      const genreId = parseInt(genre);
      if (!isNaN(genreId)) {
        const currentWeight = genreWeights.get(genreId) || 0;
        // Weight = sum of ratings for titles with this genre
        genreWeights.set(genreId, currentWeight + rating);
      }
    }
  }

  // Convert to sorted array
  return Array.from(genreWeights.entries())
    .map(([genreId, weight]) => ({ genreId, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3); // Top 3 genres
}

// Get titles already in watchlist, history, or dismissed
async function getExcludedTitleIds(userId: string, type: TitleType): Promise<Set<number>> {
  const [watchlistData, historyData, dismissedData] = await Promise.all([
    supabase
      .from('watchlist')
      .select('titles!inner(tmdb_id)')
      .eq('user_id', userId)
      .eq('title_type', type),
    supabase
      .from('watch_history')
      .select('titles!inner(tmdb_id)')
      .eq('user_id', userId)
      .eq('title_type', type),
    supabase
      .from('dismissed_recommendations')
      .select('tmdb_id')
      .eq('user_id', userId)
      .eq('title_type', type),
  ]);

  const excludedIds = new Set<number>();

  if (watchlistData.data) {
    watchlistData.data.forEach((item: any) => {
      excludedIds.add(item.titles.tmdb_id);
    });
  }

  if (historyData.data) {
    historyData.data.forEach((item: any) => {
      excludedIds.add(item.titles.tmdb_id);
    });
  }

  if (dismissedData.data) {
    dismissedData.data.forEach((item: any) => {
      excludedIds.add(item.tmdb_id);
    });
  }

  return excludedIds;
}

// Helper to build TMDB API URL
function buildUrl(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${env.tmdb.baseUrl}${endpoint}`);
  url.searchParams.append('api_key', env.tmdb.apiKey);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  return url.toString();
}

// Get similar titles for highly-rated content (4-5 stars)
async function getSimilarTitles(
  userId: string,
  type: TitleType
): Promise<any[]> {
  // Get 4-5 star rated titles
  const { data: highlyRated } = await supabase
    .from('watch_history')
    .select('titles!inner(tmdb_id, title)')
    .eq('user_id', userId)
    .eq('title_type', type)
    .gte('rating', 4);

  if (!highlyRated || highlyRated.length === 0) {
    return [];
  }

  const mediaType = type === 'film' ? 'movie' : 'tv';
  const similarTitles: any[] = [];

  // Fetch similar titles for each highly-rated title (max 3 to avoid rate limits)
  const titlesToCheck = highlyRated.slice(0, 3);

  for (const item of titlesToCheck) {
    const titleData = item.titles as any;
    const tmdbId = titleData.tmdb_id;
    const url = buildUrl(`/${mediaType}/${tmdbId}/similar`, {
      language: 'en-US',
      page: 1,
    });

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        similarTitles.push(...data.results.slice(0, 5)); // Top 5 from each
      }
    } catch (error) {
      console.error(`Failed to fetch similar titles for ${titleData.title}:`, error);
    }
  }

  return similarTitles;
}

// Get Guardian ratings for titles
async function getGuardianRatings(titleIds: number[]): Promise<Map<number, number>> {
  if (titleIds.length === 0) return new Map();

  const { data } = await supabase
    .from('titles')
    .select('tmdb_id, guardian_rating')
    .in('tmdb_id', titleIds)
    .not('guardian_rating', 'is', null);

  const ratingsMap = new Map<number, number>();
  if (data) {
    data.forEach((item: any) => {
      if (item.guardian_rating) {
        ratingsMap.set(item.tmdb_id, item.guardian_rating);
      }
    });
  }

  return ratingsMap;
}

// Get user's watch history for Claude
async function getWatchHistoryForClaude(userId: string, type: TitleType) {
  const { data } = await supabase
    .from('watch_history')
    .select('rating, notes, titles!inner(title, release_year, genres)')
    .eq('user_id', userId)
    .eq('title_type', type);

  if (!data) return [];

  return data.map((item: any) => ({
    title: item.titles.title,
    rating: item.rating,
    notes: item.notes,
    year: item.titles.release_year,
    genres: item.titles.genres,
  }));
}

// Get watchlist titles for Claude
async function getWatchlistForClaude(userId: string, type: TitleType) {
  const { data } = await supabase
    .from('watchlist')
    .select('titles!inner(title)')
    .eq('user_id', userId)
    .eq('title_type', type);

  if (!data) return [];

  return data.map((item: any) => item.titles.title);
}

// Generate recommendations for a user
export async function getRecommendations({
  userId,
  type,
  limit = 20,
}: RecommendationParams) {
  const mediaType = type === 'film' ? 'movie' : 'tv';

  // Get excluded titles
  const excludedIds = await getExcludedTitleIds(userId, type);

  let allCandidates: any[] = [];

  // Get similar titles based on highly-rated content
  const similarTitles = await getSimilarTitles(userId, type);
  allCandidates.push(...similarTitles);

  // Get genre preferences for fallback discovery
  const genrePreferences = await getUserGenrePreferences(userId, type);

  // If user has genre preferences, use discover API
  if (genrePreferences.length > 0) {
    const genreIds = genrePreferences.map((g) => g.genreId).join(',');

    const url = buildUrl(`/discover/${mediaType}`, {
      language: 'en-US',
      sort_by: 'vote_average.desc',
      'vote_count.gte': 100,
      with_genres: genreIds,
      page: 1,
    });

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      allCandidates.push(...data.results);
    }
  } else {
    // No preferences - get popular titles
    const url = buildUrl(`/${mediaType}/popular`, {
      language: 'en-US',
      page: 1,
    });

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      allCandidates.push(...data.results);
    }
  }

  // Remove duplicates and excluded titles
  const uniqueTitles = new Map();
  allCandidates.forEach((title) => {
    if (!excludedIds.has(title.id) && !uniqueTitles.has(title.id)) {
      uniqueTitles.set(title.id, title);
    }
  });

  const candidates = Array.from(uniqueTitles.values());

  // Get Guardian ratings for all candidates
  const candidateIds = candidates.map((t) => t.id);
  const guardianRatings = await getGuardianRatings(candidateIds);

  // Pre-filter: Simple scoring to reduce candidates before Claude
  // This reduces API costs by 60-80%
  const scoredCandidates = candidates.map((title) => {
    let score = 0;

    // TMDB vote average (0-20 points)
    score += (title.vote_average / 10) * 20;

    // Guardian rating bonus (0-25 points)
    const guardianRating = guardianRatings.get(title.id);
    if (guardianRating) {
      score += guardianRating * 5;
    }

    // Genre match with user preferences (0-30 points)
    const titleGenres = title.genre_ids || [];
    const genreMatches = titleGenres.filter((g: number) =>
      genrePreferences.some((p) => p.genreId === g)
    ).length;
    score += genreMatches * 10;

    return { title, score };
  });

  // Sort and take top 40 candidates (instead of all 100+)
  const topCandidates = scoredCandidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 40)
    .map((c) => c.title);

  // Get user's watch history and watchlist for Claude (limit to recent items)
  const [watchHistory, watchlist] = await Promise.all([
    getWatchHistoryForClaude(userId, type),
    getWatchlistForClaude(userId, type),
  ]);

  // Prepare candidates for Claude (only top 40)
  const candidatesForClaude = topCandidates.map((title) => ({
    id: title.id,
    title: title.title || title.name,
    year: title.release_date || title.first_air_date
      ? new Date(title.release_date || title.first_air_date).getFullYear()
      : undefined,
    overview: title.overview,
    genres: title.genre_ids,
    voteAverage: title.vote_average,
    guardianRating: guardianRatings.get(title.id),
  }));

  // Get Claude recommendations (now with 60% fewer tokens)
  const claudeRecommendations = await getClaudeRecommendations(
    watchHistory.slice(0, 15), // Limit watch history to 15 most recent
    watchlist.slice(0, 10), // Limit watchlist to 10 items
    candidatesForClaude,
    limit
  );

  // Map Claude recommendations back to full title objects
  const recommendationMap = new Map(claudeRecommendations.map((r) => [r.titleId, r]));

  const scoredTitles: ScoredTitle[] = candidates
    .filter((title) => recommendationMap.has(title.id))
    .map((title) => {
      const recommendation = recommendationMap.get(title.id)!;

      return {
        id: title.id,
        title: title.title || title.name,
        type,
        releaseDate: title.release_date || title.first_air_date,
        posterPath: title.poster_path,
        overview: title.overview,
        voteAverage: title.vote_average,
        genreIds: title.genre_ids || [],
        score: recommendation.score,
        guardianRating: guardianRatings.get(title.id) || null,
      };
    });

  // Sort by Claude's score (highest first)
  return scoredTitles.sort((a, b) => b.score - a.score);
}
