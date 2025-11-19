import { env } from '@/config/env';
import type { TMDBMovie, TMDBTVShow, TMDBSearchResult } from '@/types';

const BASE_URL = env.tmdb.baseUrl;
const API_KEY = env.tmdb.apiKey;

// Helper to build TMDB API URL
function buildUrl(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });

  return url.toString();
}

// Get poster image URL
export function getPosterUrl(path: string | null, size: 'w154' | 'w342' | 'w500' | 'original' = 'w342') {
  if (!path) return null;
  return `${env.tmdb.imageBaseUrl}/${size}${path}`;
}

// Search for movies
export async function searchMovies(query: string, page = 1): Promise<TMDBSearchResult> {
  const url = buildUrl('/search/movie', {
    query,
    page: page.toString(),
    include_adult: 'false',
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to search movies');

  return response.json();
}

// Search for TV shows
export async function searchTVShows(query: string, page = 1): Promise<TMDBSearchResult> {
  const url = buildUrl('/search/tv', {
    query,
    page: page.toString(),
    include_adult: 'false',
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to search TV shows');

  return response.json();
}

// Search both movies and TV shows (multi-search)
export async function searchMulti(query: string, page = 1) {
  const url = buildUrl('/search/multi', {
    query,
    page: page.toString(),
    include_adult: 'false',
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to search');

  const data = await response.json();

  // Filter to only include movies and TV shows (exclude people, etc.)
  const results = data.results.filter(
    (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
  );

  return {
    ...data,
    results,
  };
}

// Get movie details
export async function getMovieDetails(id: number) {
  const url = buildUrl(`/movie/${id}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to get movie details');
  return response.json();
}

// Get TV show details
export async function getTVShowDetails(id: number) {
  const url = buildUrl(`/tv/${id}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to get TV show details');
  return response.json();
}

// Get genre list for movies
export async function getMovieGenres() {
  const url = buildUrl('/genre/movie/list');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to get movie genres');
  const data = await response.json();
  return data.genres;
}

// Get genre list for TV shows
export async function getTVGenres() {
  const url = buildUrl('/genre/tv/list');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to get TV genres');
  const data = await response.json();
  return data.genres;
}

// Convert TMDB movie to our Title type
export function tmdbMovieToTitle(movie: TMDBMovie | any) {
  return {
    tmdb_id: movie.id,
    title: movie.title || movie.original_title,
    type: 'film' as const,
    release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
    poster_url: getPosterUrl(movie.poster_path),
    overview: movie.overview || '',
    genres: [], // Will be populated from genre_ids lookup
  };
}

// Convert TMDB TV show to our Title type
export function tmdbTVShowToTitle(show: TMDBTVShow | any) {
  return {
    tmdb_id: show.id,
    title: show.name || show.original_name,
    type: 'series' as const,
    release_year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : 0,
    poster_url: getPosterUrl(show.poster_path),
    overview: show.overview || '',
    genres: [], // Will be populated from genre_ids lookup
  };
}
