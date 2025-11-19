import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GuardianBadge } from './guardian-badge';
import { Film, Tv, Calendar, Plus, Check, Loader2, X } from 'lucide-react';
import { getPosterUrl } from '@/lib/tmdb';

interface TitleCardProps {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  posterPath: string | null;
  releaseDate: string;
  overview: string;
  voteAverage?: number;
  guardianRating?: number | null;
  guardianReviewUrl?: string | null;
  onAddToWatchlist?: () => void;
  onDismiss?: () => void;
  onClick?: () => void;
  isInWatchlist?: boolean;
  isAddingToWatchlist?: boolean;
  isDismissing?: boolean;
}

export function TitleCard({
  id: _id,
  title,
  type,
  posterPath,
  releaseDate,
  overview,
  voteAverage,
  guardianRating,
  guardianReviewUrl,
  onAddToWatchlist,
  onDismiss,
  onClick,
  isInWatchlist = false,
  isAddingToWatchlist = false,
  isDismissing = false,
}: TitleCardProps) {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const posterUrl = getPosterUrl(posterPath, 'w342');

  return (
    <Card className="overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer hover:shadow-xl hover:-translate-y-1 bg-card shadow-md">
      <div onClick={onClick}>
        {/* Poster */}
        <div className="relative aspect-[2/3] bg-muted overflow-hidden">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {type === 'movie' ? (
                <Film className="w-16 h-16 text-muted-foreground" />
              ) : (
                <Tv className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
          )}

          {/* Dismiss button (for recommendations) */}
          {onDismiss && (
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 left-2 h-7 w-7 p-0 shadow-md z-10"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              disabled={isDismissing}
            >
              {isDismissing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Type badge */}
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 bg-background/95 backdrop-blur-sm shadow-sm"
          >
            {type === 'movie' ? (
              <>
                <Film className="w-3 h-3 mr-1" />
                Film
              </>
            ) : (
              <>
                <Tv className="w-3 h-3 mr-1" />
                Series
              </>
            )}
          </Badge>

          {/* Hover overlay with add button */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 pointer-events-none">
            {isInWatchlist ? (
              <Badge variant="secondary" className="bg-green-600 text-white shadow-lg pointer-events-auto">
                <Check className="w-4 h-4 mr-1" />
                In Watchlist
              </Badge>
            ) : onAddToWatchlist ? (
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToWatchlist();
                }}
                disabled={isAddingToWatchlist}
              >
                {isAddingToWatchlist ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Watchlist
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2 bg-card">
          <div>
            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-accent transition-colors duration-200">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" />
              <span>{year}</span>
              {voteAverage && (
                <>
                  <span>•</span>
                  <span className="flex items-center">
                    <span className="text-accent">★</span> {voteAverage.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>

          {overview && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {overview}
            </p>
          )}

          {guardianRating && (
            <GuardianBadge rating={guardianRating} url={guardianReviewUrl} />
          )}
        </div>
      </div>
    </Card>
  );
}
