import { supabase } from '@/config/supabase';
import { env } from '@/config/env';
import type { TitleType } from '@/types';
import { getClaudeRecommendations } from './claude-recommendations';
import { getGenreNames } from './genres';
import { getBestGuardianReview } from './guardian';

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
  guardianReviewUrl?: string | null;
  reasoning?: string;
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

// Get Guardian ratings and review URLs for titles
async function getGuardianRatings(titleIds: number[]): Promise<Map<number, { rating: number; url: string | null }>> {
  if (titleIds.length === 0) return new Map();

  const { data } = await supabase
    .from('titles')
    .select('tmdb_id, guardian_rating, guardian_review_url')
    .in('tmdb_id', titleIds)
    .not('guardian_rating', 'is', null);

  const ratingsMap = new Map<number, { rating: number; url: string | null }>();
  if (data) {
    data.forEach((item: any) => {
      if (item.guardian_rating) {
        ratingsMap.set(item.tmdb_id, {
          rating: item.guardian_rating,
          url: item.guardian_review_url || null
        });
      }
    });
  }

  return ratingsMap;
}

// Enrich candidates with Guardian reviews (before Claude selection)
async function enrichCandidatesWithGuardian(
  candidates: any[],
  type: TitleType,
  guardianRatingsMap: Map<number, { rating: number; url: string | null }>
): Promise<Array<any & { guardianRating: number | null; guardianReviewUrl: string | null }>> {
  const enrichedCandidates = await Promise.all(
    candidates.map(async (candidate) => {
      // Check if already has Guardian rating from database
      const existingData = guardianRatingsMap.get(candidate.id);
      if (existingData) {
        return {
          ...candidate,
          guardianRating: existingData.rating,
          guardianReviewUrl: existingData.url
        };
      }

      // Fetch Guardian review
      try {
        const title = candidate.title || candidate.name;
        const releaseDate = candidate.release_date || candidate.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
        const guardianReview = await getBestGuardianReview(title, year, type);

        if (guardianReview.rating) {
          // Store in database for future use
          await supabase
            .from('titles')
            .upsert({
              tmdb_id: candidate.id,
              title,
              type,
              release_year: year,
              poster_url: candidate.poster_path ? `https://image.tmdb.org/t/p/w342${candidate.poster_path}` : null,
              overview: candidate.overview,
              genres: (candidate.genre_ids || []).map(String),
              guardian_rating: guardianReview.rating,
              guardian_review_url: guardianReview.url,
              guardian_review_excerpt: guardianReview.excerpt,
            }, {
              onConflict: 'tmdb_id',
            });

          return {
            ...candidate,
            guardianRating: guardianReview.rating,
            guardianReviewUrl: guardianReview.url
          };
        }
      } catch (error) {
        console.error(`Failed to fetch Guardian review for ${candidate.title || candidate.name}:`, error);
      }

      return { ...candidate, guardianRating: null, guardianReviewUrl: null };
    })
  );

  return enrichedCandidates;
}

// Get user's watch history for Claude
async function getWatchHistoryForClaude(userId: string, type: TitleType) {
  const { data } = await supabase
    .from('watch_history')
    .select('rating, notes, titles!inner(title, release_year, genres)')
    .eq('user_id', userId)
    .eq('title_type', type);

  if (!data) return [];

  return data.map((item: any) => {
    const genreIds = (item.titles.genres || []).map((g: string) => parseInt(g)).filter((id: number) => !isNaN(id));
    return {
      title: item.titles.title,
      rating: item.rating,
      notes: item.notes,
      year: item.titles.release_year,
      genres: getGenreNames(genreIds),
    };
  });
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

// Get dismissed recommendations for Claude (to avoid similar titles)
async function getDismissedForClaude(userId: string, type: TitleType) {
  const { data } = await supabase
    .from('dismissed_recommendations')
    .select('title, release_year')
    .eq('user_id', userId)
    .eq('title_type', type)
    .order('dismissed_at', { ascending: false })
    .limit(20); // Only recent dismissals matter

  if (!data) return [];

  return data.map((item: any) => ({
    title: item.title,
    year: item.release_year,
  }));
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

  // Calculate date range for recent releases (past 5 years)
  const currentYear = new Date().getFullYear();
  const minReleaseDate = `${currentYear - 5}-01-01`;
  const dateParam = mediaType === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte';

  // If user has genre preferences, use discover API (fetch multiple pages)
  if (genrePreferences.length > 0) {
    const genreIds = genrePreferences.map((g) => g.genreId).join(',');

    // Fetch 3 pages to get more candidates for strict filtering
    // Prioritize recent releases from past 5 years
    for (let page = 1; page <= 3; page++) {
      const url = buildUrl(`/discover/${mediaType}`, {
        language: 'en-US',
        sort_by: 'popularity.desc', // Changed to popularity to get recent trending titles
        'vote_count.gte': 50,
        'vote_average.gte': 6.0,
        with_genres: genreIds,
        [dateParam]: minReleaseDate, // Only titles from past 5 years
        page,
      });

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        allCandidates.push(...data.results);
      }
    }
  } else {
    // No preferences - get recent popular titles (fetch multiple pages)
    for (let page = 1; page <= 3; page++) {
      const url = buildUrl(`/discover/${mediaType}`, {
        language: 'en-US',
        sort_by: 'popularity.desc',
        'vote_count.gte': 50,
        'vote_average.gte': 6.0,
        [dateParam]: minReleaseDate, // Only titles from past 5 years
        page,
      });

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        allCandidates.push(...data.results);
      }
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

  // Pre-filter by TMDB quality before Guardian enrichment
  const qualityCandidates = candidates
    .filter((title) => {
      // Filter out low-quality titles (below 6.5/10 on TMDB)
      if (title.vote_average < 6.5) return false;
      // Require at least 50 votes to ensure quality
      if ((title.vote_count || 0) < 50) return false;
      return true;
    })
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 100); // Top 100 by TMDB rating for Guardian enrichment

  // For films: enrich with Guardian reviews and filter by 4-5 star ratings
  // For series: skip Guardian enrichment (Guardian rarely reviews TV series with star ratings)
  let enrichedCandidates: Array<any & { guardianRating: number | null; guardianReviewUrl: string | null }>;

  if (type === 'film') {
    // Get existing Guardian ratings from database
    const candidateIds = qualityCandidates.map((t) => t.id);
    const guardianRatings = await getGuardianRatings(candidateIds);

    // Enrich top candidates with Guardian reviews (fetch fresh for titles without ratings)
    console.log(`Enriching ${qualityCandidates.length} film candidates with Guardian reviews...`);
    enrichedCandidates = await enrichCandidatesWithGuardian(
      qualityCandidates,
      type,
      guardianRatings
    );
  } else {
    // For series, add null Guardian data without API calls
    console.log(`Skipping Guardian enrichment for ${qualityCandidates.length} series candidates (Guardian rarely reviews TV series)`);
    enrichedCandidates = qualityCandidates.map(c => ({
      ...c,
      guardianRating: null,
      guardianReviewUrl: null
    }));
  }

  // STRICT FILTER: Only titles with 4-5 star Guardian ratings (films only)
  // For series: use TMDB rating filter (7.5+)
  const highQualityCandidates = enrichedCandidates
    .filter((title) => {
      if (type === 'film') {
        return title.guardianRating && title.guardianRating >= 4;
      } else {
        // For series, require high TMDB rating
        return title.vote_average >= 7.5;
      }
    })
    .map((title) => {
      let score = 0;

      // TMDB vote average (0-20 points)
      score += (title.vote_average / 10) * 20;

      // Guardian rating (4-5 stars = +40-50 points) - films only
      if (title.guardianRating) {
        score += title.guardianRating * 10;
      }

      // Genre match with user preferences (0-60 points) - HIGHEST WEIGHT
      // Matches genres from titles you've rated highly
      const titleGenres = title.genre_ids || [];
      const genreMatches = titleGenres.filter((g: number) =>
        genrePreferences.some((p) => p.genreId === g)
      ).length;
      score += genreMatches * 20; // 20 points per matching genre (up to 3 genres)

      // Recency bias (0-20 points) - prioritize titles from past 3 years
      const releaseDate = title.release_date || title.first_air_date;
      if (releaseDate) {
        const releaseYear = new Date(releaseDate).getFullYear();
        const yearsSinceRelease = currentYear - releaseYear;

        if (yearsSinceRelease <= 3) {
          // Titles from past 3 years get bonus points (newer = more points)
          score += Math.max(0, 20 - (yearsSinceRelease * 5)); // 20, 15, 10, 5 points
        }
      }

      return { title, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 40); // Top 40 for Claude

  if (type === 'film') {
    console.log(`Found ${highQualityCandidates.length} films with 4-5 star Guardian ratings`);
  } else {
    console.log(`Found ${highQualityCandidates.length} series with 7.5+ TMDB ratings`);
  }

  const topCandidates = highQualityCandidates.map((c) => c.title);

  // Get user's watch history, watchlist, and dismissed titles for Claude
  const [watchHistory, watchlist, dismissed] = await Promise.all([
    getWatchHistoryForClaude(userId, type),
    getWatchlistForClaude(userId, type),
    getDismissedForClaude(userId, type),
  ]);

  // Prepare candidates for Claude (top 40 high-quality titles with genre names)
  const candidatesForClaude = topCandidates.map((title) => ({
    id: title.id,
    title: title.title || title.name,
    year: title.release_date || title.first_air_date
      ? new Date(title.release_date || title.first_air_date).getFullYear()
      : undefined,
    overview: title.overview,
    genres: getGenreNames(title.genre_ids || []),
    voteAverage: title.vote_average,
    guardianRating: title.guardianRating, // Films: 4-5 stars, Series: null
  }));

  // Get Claude recommendations (with genre names and dismissed titles for better context)
  const claudeRecommendations = await getClaudeRecommendations(
    watchHistory.slice(0, 15), // Limit watch history to 15 most recent
    watchlist.slice(0, 10), // Limit watchlist to 10 items
    dismissed.slice(0, 10), // Limit dismissed to 10 most recent
    candidatesForClaude,
    limit
  );

  // Map Claude recommendations back to full title objects (films: 4-5 Guardian stars, series: 7.5+ TMDB)
  const recommendationMap = new Map(claudeRecommendations.map((r) => [r.titleId, r]));

  const scoredTitles: ScoredTitle[] = enrichedCandidates
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
        guardianRating: title.guardianRating, // Already enriched with 4-5 star ratings
        guardianReviewUrl: title.guardianReviewUrl, // Guardian review URL
        reasoning: recommendation.reasoning,
      };
    });

  // Sort by Claude's score (highest first) and return
  return scoredTitles.sort((a, b) => b.score - a.score);
}
