import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TitleCard } from '@/components/custom/title-card';
import { MarkWatchedDialog } from '@/components/custom/mark-watched-dialog';
import { ContentSectionNav } from '@/components/custom/content-section-nav';
import { useWatchlist, useRemoveFromWatchlist } from '@/hooks/use-watchlist';
import { useMarkAsWatched } from '@/hooks/use-watch-history';
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

export function FilmsWatchlistPage() {
  const { data: watchlist, isLoading: isLoadingWatchlist } = useWatchlist('film');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">Films</h1>
        <p className="text-lg text-muted-foreground">
          Your film watchlist
        </p>
      </div>

      <ContentSectionNav basePath="films" watchlistCount={watchlist?.length} />

      <div className="mt-8">
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
            <p className="text-lg text-muted-foreground">Your film watchlist is empty</p>
            <Link to="/search">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
                Search for Films
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
