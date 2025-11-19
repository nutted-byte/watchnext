import { useQuery } from '@tanstack/react-query';
import { searchMulti, searchMovies, searchTVShows } from '@/lib/tmdb';

// Hook for searching both movies and TV shows
export function useSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ['search', 'multi', query],
    queryFn: () => searchMulti(query),
    enabled: enabled && query.length >= 2, // Only search if query is at least 2 characters
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Hook for searching only movies
export function useSearchMovies(query: string, enabled = true) {
  return useQuery({
    queryKey: ['search', 'movies', query],
    queryFn: () => searchMovies(query),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 60,
  });
}

// Hook for searching only TV shows
export function useSearchTVShows(query: string, enabled = true) {
  return useQuery({
    queryKey: ['search', 'tv', query],
    queryFn: () => searchTVShows(query),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 60,
  });
}
