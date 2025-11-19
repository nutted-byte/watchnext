import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/context/auth-context';
import { dismissRecommendation } from '@/lib/dismissed-recommendations';
import type { TitleType } from '@/types';
import { toast } from 'sonner';

// Dismiss a recommendation
export function useDismissRecommendation() {
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
      dismissRecommendation(
        user!.id,
        tmdbId,
        title,
        type,
        releaseYear,
        posterUrl,
        overview
      ),
    onSuccess: () => {
      toast.success('Dismissed recommendation');
      // Force refetch recommendations to remove dismissed title
      queryClient.invalidateQueries({
        queryKey: ['recommendations'],
        refetchType: 'all'
      });
      queryClient.refetchQueries({ queryKey: ['recommendations'] });
    },
    onError: (error: Error) => {
      if (error.message === 'Already dismissed') {
        toast.error('Already dismissed this recommendation');
      } else {
        toast.error('Failed to dismiss recommendation');
      }
    },
  });
}
