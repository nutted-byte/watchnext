import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TitleCard } from '@/components/custom/title-card';
import { StarRating } from '@/components/custom/star-rating';
import { MarkWatchedDialog } from '@/components/custom/mark-watched-dialog';
import { RecommendationDetailModal } from '@/components/custom/recommendation-detail-modal';
import { useWatchlist, useRemoveFromWatchlist, useAddToWatchlist } from '@/hooks/use-watchlist';
import { useWatchHistory, useMarkAsWatched, useRemoveFromHistory } from '@/hooks/use-watch-history';
import { useRecommendations } from '@/hooks/use-recommendations';
import { useDismissRecommendation } from '@/hooks/use-dismissed-recommendations';
import { Loader2, Trash2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

function WatchlistCard({ item }: { item: any }) {
  const [showWatchedDialog, setShowWatchedDialog] = useState(false);
  const removeFromWatchlist = useRemoveFromWatchlist();
  const markAsWatched = useMarkAsWatched();

  const handleRemove = () => {
    removeFromWatchlist.mutate({
      titleId: item.title_id,
      tmdbId: item.titles.tmdb_id,
    });
  };

  const handleMarkAsWatched = (rating: number, notes?: string) => {
    markAsWatched.mutate(
      {
        tmdbId: item.titles.tmdb_id,
        title: item.titles.title,
        type: item.titles.type,
        releaseYear: item.titles.release_year,
        posterUrl: item.titles.poster_url,
        overview: item.titles.overview,
        rating,
        notes,
      },
      {
        onSuccess: () => {
          setShowWatchedDialog(false);
        },
      }
    );
  };

  return (
    <>
      <div className="relative group">
        <div onClick={(e) => e.stopPropagation()}>
          <TitleCard
            id={item.titles.tmdb_id}
            title={item.titles.title}
            type={item.titles.type === 'film' ? 'movie' : 'tv'}
            posterPath={item.titles.poster_url?.replace('https://image.tmdb.org/t/p/w342', '')}
            releaseDate={item.titles.release_year?.toString()}
            overview={item.titles.overview}
            guardianRating={item.titles.guardian_rating}
            guardianReviewUrl={item.titles.guardian_review_url}
            isInWatchlist={true}
          />
        </div>
        <div className="absolute bottom-20 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 flex justify-between items-center z-20 pointer-events-none">
          <Button
            variant="destructive"
            size="sm"
            className="shadow-lg pointer-events-auto hover:scale-105 transition-transform"
            onClick={handleRemove}
            disabled={removeFromWatchlist.isPending}
          >
            {removeFromWatchlist.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            className="shadow-lg pointer-events-auto bg-accent hover:bg-accent/90 text-accent-foreground hover:scale-105 transition-transform"
            onClick={() => setShowWatchedDialog(true)}
          >
            <Check className="w-4 h-4 mr-1" />
            Mark Watched
          </Button>
        </div>
      </div>
      <MarkWatchedDialog
        open={showWatchedDialog}
        onOpenChange={setShowWatchedDialog}
        title={item.titles.title}
        onConfirm={handleMarkAsWatched}
        isPending={markAsWatched.isPending}
      />
    </>
  );
}

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

export function SeriesPage() {
  const { data: watchlist, isLoading: isLoadingWatchlist } = useWatchlist('series');
  const { data: history, isLoading: isLoadingHistory } = useWatchHistory('series');
  const { data: recommendations, isLoading: isLoadingRecommendations } = useRecommendations('series');
  const addToWatchlist = useAddToWatchlist();
  const dismissRecommendation = useDismissRecommendation();
  const removeFromHistory = useRemoveFromHistory();
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);

  const handleAddToWatchlist = (title: any) => {
    addToWatchlist.mutate({
      tmdbId: title.id,
      title: title.title,
      type: 'series',
      releaseYear: title.releaseDate ? new Date(title.releaseDate).getFullYear() : 0,
      posterUrl: title.posterPath ? `https://image.tmdb.org/t/p/w342${title.posterPath}` : null,
      overview: title.overview || '',
    });
  };

  const handleDismiss = (title: any) => {
    dismissRecommendation.mutate({
      tmdbId: title.id,
      title: title.title,
      type: 'series',
      releaseYear: title.releaseDate ? new Date(title.releaseDate).getFullYear() : 0,
      posterUrl: title.posterPath ? `https://image.tmdb.org/t/p/w342${title.posterPath}` : null,
      overview: title.overview || '',
    });
  };

  const handleClearHistory = () => {
    if (history && history.length > 0) {
      if (window.confirm(`Clear all ${history.length} watched series?`)) {
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
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">TV Series</h1>
        <p className="text-lg text-muted-foreground">
          Personalized TV series recommendations just for you
        </p>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-8">
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="watchlist">
            Watchlist {watchlist && `(${watchlist.length})`}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          {isLoadingRecommendations ? (
            <div className="text-center py-20">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent" />
              <p className="text-muted-foreground mt-4">Loading recommendations...</p>
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {recommendations.map((title: any) => (
                <TitleCard
                  key={title.id}
                  id={title.id}
                  title={title.title}
                  type="tv"
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
          ) : (
            <div className="text-center py-20 text-muted-foreground space-y-3">
              <p className="text-lg">No recommendations yet</p>
              <p className="text-sm max-w-md mx-auto">
                Add series to your watchlist and rate them to get personalized recommendations
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-6 overflow-visible">
          {isLoadingWatchlist ? (
            <div className="text-center py-20">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent" />
              <p className="text-muted-foreground mt-4">Loading watchlist...</p>
            </div>
          ) : watchlist && watchlist.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-4 pb-4">
              {watchlist.map((item: any) => (
                <WatchlistCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-5">
              <p className="text-lg text-muted-foreground">Your TV series watchlist is empty</p>
              <Link to="/search">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
                  Search for TV Series
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
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
              <p className="text-lg">You haven't watched any TV series yet</p>
              <p className="text-sm max-w-md mx-auto">
                Mark series as watched from your watchlist to track your viewing history
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
          reasoning={selectedRecommendation.reasoning}
        />
      )}
    </div>
  );
}
