import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/context/auth-context';
import {
  getWatchHistory,
  markAsWatched,
  updateWatchHistory,
  removeFromHistory,
  isWatched,
} from '@/lib/watch-history';
import type { TitleType } from '@/types';
import { toast } from 'sonner';

// Get watch history
export function useWatchHistory(type?: TitleType) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['watch-history', user?.id, type],
    queryFn: () => getWatchHistory(user!.id, type),
    enabled: !!user,
  });
}

// Check if title is watched
export function useIsWatched(tmdbId: number) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['watched-check', user?.id, tmdbId],
    queryFn: () => isWatched(user!.id, tmdbId),
    enabled: !!user && !!tmdbId,
  });
}

// Mark as watched mutation
export function useMarkAsWatched() {
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
      rating,
      notes,
    }: {
      tmdbId: number;
      title: string;
      type: TitleType;
      releaseYear: number;
      posterUrl: string | null;
      overview: string;
      rating: number;
      notes?: string;
    }) =>
      markAsWatched(
        user!.id,
        tmdbId,
        title,
        type,
        releaseYear,
        posterUrl,
        overview,
        rating,
        notes
      ),
    onSuccess: (data, variables) => {
      toast.success(`Marked "${variables.title}" as watched`);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({
        queryKey: ['watched-check', user?.id, variables.tmdbId],
      });
      queryClient.invalidateQueries({
        queryKey: ['watchlist-check', user?.id, variables.tmdbId],
      });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
    onError: () => {
      toast.error('Failed to mark as watched');
    },
  });
}

// Update watch history mutation
export function useUpdateWatchHistory() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      titleId,
      rating,
      notes,
    }: {
      titleId: string;
      rating: number;
      notes?: string;
    }) => updateWatchHistory(user!.id, titleId, rating, notes),
    onSuccess: () => {
      toast.success('Updated rating');
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
    onError: () => {
      toast.error('Failed to update rating');
    },
  });
}

// Remove from history mutation
export function useRemoveFromHistory() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ titleId, tmdbId }: { titleId: string; tmdbId: number }) =>
      removeFromHistory(user!.id, titleId),
    onSuccess: (_data, variables) => {
      toast.success('Removed from history');
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({
        queryKey: ['watched-check', user?.id, variables.tmdbId],
      });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
    onError: () => {
      toast.error('Failed to remove from history');
    },
  });
}
