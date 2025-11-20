import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Calendar, TrendingUp, Sparkles, ExternalLink } from 'lucide-react';
import { getGenreNames } from '@/lib/genres';

interface RecommendationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  year: number;
  posterPath: string | null;
  overview: string;
  voteAverage: number;
  genreIds: number[];
  guardianRating?: number | null;
  guardianReviewUrl?: string | null;
  reasoning?: string;
}

export function RecommendationDetailModal({
  open,
  onOpenChange,
  title,
  year,
  posterPath,
  overview,
  voteAverage,
  genreIds,
  guardianRating,
  guardianReviewUrl,
  reasoning,
}: RecommendationDetailModalProps) {
  const genres = getGenreNames(genreIds);
  const posterUrl = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-base">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {year}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {voteAverage.toFixed(1)}/10
            </span>
            {guardianRating && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Guardian: {guardianRating}/5
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Poster and genres */}
          <div className="flex gap-4">
            {posterUrl && (
              <img
                src={posterUrl}
                alt={title}
                className="w-32 h-48 object-cover rounded-md"
              />
            )}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Why recommended */}
          {reasoning && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Why we recommend this
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {reasoning}
              </p>
            </div>
          )}

          {/* Overview */}
          <div className="space-y-2">
            <h3 className="font-semibold">Overview</h3>
            <p className="text-muted-foreground leading-relaxed">{overview}</p>
          </div>

          {/* Guardian Review Link */}
          {guardianReviewUrl && (
            <div>
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <a
                  href={guardianReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Read Full Guardian Review
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
