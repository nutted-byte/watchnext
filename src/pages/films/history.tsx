import { Button } from '@/components/ui/button';
import { TitleCard } from '@/components/custom/title-card';
import { StarRating } from '@/components/custom/star-rating';
import { ContentSectionNav } from '@/components/custom/content-section-nav';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useWatchHistory, useRemoveFromHistory } from '@/hooks/use-watch-history';
import { Loader2, Trash2 } from 'lucide-react';

function HistoryCard({ item }: { item: any }) {
  const removeFromHistory = useRemoveFromHistory();

  const handleRemove = () => {
    removeFromHistory.mutate({
      titleId: item.title_id,
      tmdbId: item.titles.tmdb_id,
    });
  };

  return (
    <div className="relative group">
      <TitleCard
        id={item.titles.tmdb_id}
        title={item.titles.title}
        type={item.titles.type === 'film' ? 'movie' : 'tv'}
        posterPath={item.titles.poster_url?.replace('https://image.tmdb.org/t/p/w342', '')}
        releaseDate={item.titles.release_year?.toString()}
        overview={item.titles.overview}
        guardianRating={item.titles.guardian_rating}
        guardianReviewUrl={item.titles.guardian_review_url}
      />
      <div className="absolute bottom-2 left-2 right-2 bg-background/90 backdrop-blur-sm p-2 rounded">
        <StarRating rating={item.rating} readonly size="sm" />
        {item.notes && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {item.notes}
          </p>
        )}
      </div>
      <Button
        variant="destructive"
        size="sm"
        className="absolute top-2 left-2 shadow-lg z-10"
        onClick={handleRemove}
        disabled={removeFromHistory.isPending}
      >
        {removeFromHistory.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

export function FilmsHistoryPage() {
  const { data: watchlist } = useWatchlist('film');
  const { data: history, isLoading: isLoadingHistory } = useWatchHistory('film');
  const removeFromHistory = useRemoveFromHistory();

  const handleClearHistory = () => {
    if (history && history.length > 0) {
      if (window.confirm(`Clear all ${history.length} watched films?`)) {
        history.forEach((item: any) => {
          removeFromHistory.mutate({
            titleId: item.title_id,
            tmdbId: item.titles.tmdb_id,
          });
        });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">Films</h1>
        <p className="text-lg text-muted-foreground">
          Your watch history
        </p>
      </div>

      <ContentSectionNav basePath="films" watchlistCount={watchlist?.length} />

      <div className="mt-8">
        {isLoadingHistory ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent" />
            <p className="text-muted-foreground mt-4">Loading history...</p>
          </div>
        ) : history && history.length > 0 ? (
          <>
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                disabled={removeFromHistory.isPending}
                className="border-border hover:bg-muted transition-colors"
              >
                Clear All History (Testing)
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {history.map((item: any) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground space-y-3">
            <p className="text-lg">You haven't watched any films yet</p>
            <p className="text-sm max-w-md mx-auto">
              Mark films as watched from your watchlist to track your viewing history
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
