import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/context/auth-context';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from '@/lib/watchlist';
import type { TitleType } from '@/types';
import { toast } from 'sonner';

// Get watchlist
export function useWatchlist(type?: TitleType) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['watchlist', user?.id, type],
    queryFn: () => getWatchlist(user!.id, type),
    enabled: !!user,
  });
}

// Check if title is in watchlist
export function useIsInWatchlist(tmdbId: number) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['watchlist-check', user?.id, tmdbId],
    queryFn: () => isInWatchlist(user!.id, tmdbId),
    enabled: !!user && !!tmdbId,
  });
}

// Add to watchlist mutation
export function useAddToWatchlist() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tmdbId,
      title,
      type,
      releaseYear,
      posterUrl,
      overview,
    }: {
      tmdbId: number;
      title: string;
      type: TitleType;
      releaseYear: number;
      posterUrl: string | null;
      overview: string;
    }) =>
      addToWatchlist(user!.id, tmdbId, title, type, releaseYear, posterUrl, overview),
    onSuccess: (data, variables) => {
      toast.success(`Added "${variables.title}" to watchlist`);
      // Invalidate watchlist and recommendations queries
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({
        queryKey: ['watchlist-check', user?.id, variables.tmdbId],
      });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
    onError: (error: Error) => {
      if (error.message === 'Title already in watchlist') {
        toast.error('Title already in your watchlist');
      } else {
        toast.error('Failed to add to watchlist');
      }
    },
  });
}

// Remove from watchlist mutation
export function useRemoveFromWatchlist() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ titleId, tmdbId }: { titleId: string; tmdbId: number }) =>
      removeFromWatchlist(user!.id, titleId),
    onSuccess: (_data, variables) => {
      toast.success('Removed from watchlist');
      // Invalidate watchlist and recommendations queries
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({
        queryKey: ['watchlist-check', user?.id, variables.tmdbId],
      });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
    onError: () => {
      toast.error('Failed to remove from watchlist');
    },
  });
}
