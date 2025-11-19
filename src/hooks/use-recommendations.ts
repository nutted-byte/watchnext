import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/context/auth-context';
import { getRecommendations } from '@/lib/recommendations';
import type { TitleType } from '@/types';

export function useRecommendations(type: TitleType, limit = 20) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['recommendations', user?.id, type, limit],
    queryFn: () => getRecommendations({ userId: user!.id, type, limit }),
    enabled: !!user,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - reduce API costs
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in cache for a week
  });
}
