import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TitleCard } from '@/components/custom/title-card';
import { RecommendationDetailModal } from '@/components/custom/recommendation-detail-modal';
import { ContentSectionNav } from '@/components/custom/content-section-nav';
import { useWatchlist, useAddToWatchlist } from '@/hooks/use-watchlist';
import { useRecommendations } from '@/hooks/use-recommendations';
import { useDismissRecommendation } from '@/hooks/use-dismissed-recommendations';
import { Loader2, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function FilmsRecommendationsPage() {
  const { data: watchlist } = useWatchlist('film');
  const { data: recommendations, isLoading: isLoadingRecommendations } = useRecommendations('film');
  const addToWatchlist = useAddToWatchlist();
  const dismissRecommendation = useDismissRecommendation();
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const queryClient = useQueryClient();

  const handleAddToWatchlist = (title: any) => {
    addToWatchlist.mutate({
      tmdbId: title.id,
      title: title.title,
      type: 'film',
      releaseYear: title.releaseDate ? new Date(title.releaseDate).getFullYear() : 0,
      posterUrl: title.posterPath ? `https://image.tmdb.org/t/p/w342${title.posterPath}` : null,
      overview: title.overview || '',
    });
  };

  const handleDismiss = (title: any) => {
    dismissRecommendation.mutate({
      tmdbId: title.id,
      title: title.title,
      type: 'film',
      releaseYear: title.releaseDate ? new Date(title.releaseDate).getFullYear() : 0,
      posterUrl: title.posterPath ? `https://image.tmdb.org/t/p/w342${title.posterPath}` : null,
      overview: title.overview || '',
    });
  };

  const handleRefreshRecommendations = () => {
    // Clear all recommendation cache
    queryClient.removeQueries({ queryKey: ['recommendations'] });
    // Force refetch
    queryClient.refetchQueries({ queryKey: ['recommendations'] });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">Films</h1>
        <p className="text-lg text-muted-foreground">
          Personalized film recommendations just for you
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent releases prioritized (past 3 years)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            4-5 star Guardian ratings only
          </span>
        </div>
      </div>

      <ContentSectionNav basePath="films" watchlistCount={watchlist?.length} />

      <div className="mt-8">
        {isLoadingRecommendations ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent" />
            <p className="text-muted-foreground mt-4">Loading recommendations...</p>
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <>
            <div className="flex justify-end mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshRecommendations}
                disabled={isLoadingRecommendations}
                className="border-border hover:bg-muted transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Recommendations
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {recommendations.map((title: any) => (
                <TitleCard
                  key={title.id}
                  id={title.id}
                  title={title.title}
                  type="movie"
                  posterPath={title.posterPath}
                  releaseDate={title.releaseDate}
                  overview={title.overview}
                  voteAverage={title.voteAverage}
                  guardianRating={title.guardianRating}
                  onAddToWatchlist={() => handleAddToWatchlist(title)}
                  onDismiss={() => handleDismiss(title)}
                  onClick={() => setSelectedRecommendation(title)}
                  isAddingToWatchlist={addToWatchlist.isPending}
                  isDismissing={dismissRecommendation.isPending}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground space-y-3">
            <p className="text-lg">No recommendations yet</p>
            <p className="text-sm max-w-md mx-auto">
              Add films to your watchlist and rate them to get personalized recommendations
            </p>
          </div>
        )}
      </div>

      {selectedRecommendation && (
        <RecommendationDetailModal
          open={!!selectedRecommendation}
          onOpenChange={(open) => !open && setSelectedRecommendation(null)}
          title={selectedRecommendation.title}
          year={selectedRecommendation.releaseDate ? new Date(selectedRecommendation.releaseDate).getFullYear() : 0}
          posterPath={selectedRecommendation.posterPath}
          overview={selectedRecommendation.overview}
          voteAverage={selectedRecommendation.voteAverage}
          genreIds={selectedRecommendation.genreIds || []}
          guardianRating={selectedRecommendation.guardianRating}
          guardianReviewUrl={selectedRecommendation.guardianReviewUrl}
          reasoning={selectedRecommendation.reasoning}
        />
      )}
    </div>
  );
}
