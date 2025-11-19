import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TitleCard } from '@/components/custom/title-card';
import { useAddToWatchlist } from '@/hooks/use-watchlist';
import { Film, ArrowRight, CheckCircle } from 'lucide-react';
import { searchMulti } from '@/lib/tmdb';

const POPULAR_TITLES = [
  'The Shawshank Redemption',
  'The Godfather',
  'Breaking Bad',
  'The Office',
  'Inception',
  'Stranger Things',
];

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const navigate = useNavigate();
  const addToWatchlist = useAddToWatchlist();

  const fetchPopularTitles = async () => {
    setLoading(true);
    const results: any[] = [];

    for (const title of POPULAR_TITLES) {
      try {
        const data = await searchMulti(title, 1);
        if (data.results.length > 0) {
          results.push(data.results[0]);
        }
      } catch (error) {
        console.error(`Error fetching ${title}:`, error);
      }
    }

    setSearchResults(results);
    setLoading(false);
  };

  const handleAddToWatchlist = (title: any) => {
    addToWatchlist.mutate(
      {
        tmdbId: title.id,
        title: title.title || title.name,
        type: title.media_type === 'movie' ? 'film' : 'series',
        releaseYear: title.release_date || title.first_air_date
          ? new Date(title.release_date || title.first_air_date).getFullYear()
          : 0,
        posterUrl: title.poster_path
          ? `https://image.tmdb.org/t/p/w342${title.poster_path}`
          : null,
        overview: title.overview || '',
      },
      {
        onSuccess: () => {
          setAddedCount((prev) => prev + 1);
        },
      }
    );
  };

  const handleComplete = () => {
    navigate('/home');
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-2xl w-full text-center space-y-6">
          <Film className="w-16 h-16 text-accent mx-auto" />
          <h1 className="text-4xl font-bold">Welcome to WatchNext!</h1>
          <p className="text-xl text-muted-foreground">
            Let's personalize your experience by adding a few titles you're interested in
          </p>
          <Button
            size="lg"
            onClick={() => {
              setStep(2);
              fetchPopularTitles();
            }}
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Add titles to your watchlist</h2>
          <p className="text-muted-foreground">
            Select any titles you'd like to watch. We'll use this to personalize your recommendations.
          </p>
          {addedCount > 0 && (
            <div className="mt-4 flex items-center gap-2 text-accent">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{addedCount} titles added</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading popular titles...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {searchResults.map((title: any) => (
                <TitleCard
                  key={title.id}
                  id={title.id}
                  title={title.title || title.name}
                  type={title.media_type === 'movie' ? 'movie' : 'tv'}
                  posterPath={title.poster_path}
                  releaseDate={title.release_date || title.first_air_date}
                  overview={title.overview}
                  voteAverage={title.vote_average}
                  onAddToWatchlist={() => handleAddToWatchlist(title)}
                  isAddingToWatchlist={addToWatchlist.isPending}
                />
              ))}
            </div>

            <div className="flex justify-center">
              <Button size="lg" onClick={handleComplete}>
                {addedCount > 0 ? 'Continue to WatchNext' : 'Skip for now'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
