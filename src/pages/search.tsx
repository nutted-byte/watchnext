import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TitleCard } from '@/components/custom/title-card';
import { useSearch } from '@/hooks/use-search';
import { useAddToWatchlist, useIsInWatchlist } from '@/hooks/use-watchlist';
import { getPosterUrl } from '@/lib/tmdb';
import { Search as SearchIcon, Loader2, Film, Tv } from 'lucide-react';

type FilterType = 'all' | 'movie' | 'tv';

// Separate component for each search result to manage its own watchlist state
function SearchResultCard({ item }: { item: any }) {
  const addToWatchlist = useAddToWatchlist();
  const { data: isInWatchlist } = useIsInWatchlist(item.id);

  const handleAddToWatchlist = () => {
    const type = item.media_type === 'movie' ? 'film' : 'series';
    const releaseYear = item.release_date || item.first_air_date
      ? new Date(item.release_date || item.first_air_date).getFullYear()
      : 0;

    addToWatchlist.mutate({
      tmdbId: item.id,
      title: item.title || item.name,
      type,
      releaseYear,
      posterUrl: getPosterUrl(item.poster_path),
      overview: item.overview || '',
    });
  };

  return (
    <TitleCard
      id={item.id}
      title={item.title || item.name}
      type={item.media_type}
      posterPath={item.poster_path}
      releaseDate={item.release_date || item.first_air_date}
      overview={item.overview}
      voteAverage={item.vote_average}
      onAddToWatchlist={handleAddToWatchlist}
      isInWatchlist={isInWatchlist}
      isAddingToWatchlist={addToWatchlist.isPending}
      onClick={() => console.log('Open title detail:', item.id)}
    />
  );
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const { data, isLoading, error } = useSearch(debouncedQuery);

  // Debounce search query
  const handleSearch = (value: string) => {
    setQuery(value);
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  // Filter results by type
  const filteredResults = useMemo(() => {
    if (!data?.results) return [];

    if (filter === 'all') return data.results;

    return data.results.filter((item: any) => item.media_type === filter);
  }, [data, filter]);


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Search</h1>
            <p className="text-muted-foreground">
              Find films and TV series to add to your watchlist
            </p>
          </div>

          {/* Search input */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for films or TV series..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 h-12 text-lg"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Filters */}
          {debouncedQuery && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'movie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('movie')}
              >
                <Film className="w-4 h-4 mr-1" />
                Films
              </Button>
              <Button
                variant={filter === 'tv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('tv')}
              >
                <Tv className="w-4 h-4 mr-1" />
                TV Series
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {!debouncedQuery && (
            <div className="text-center py-12 text-muted-foreground">
              <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Start typing to search for films and TV series</p>
            </div>
          )}

          {debouncedQuery && isLoading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" />
              <p className="text-muted-foreground mt-4">Searching...</p>
            </div>
          )}

          {debouncedQuery && error && (
            <div className="text-center py-12 text-destructive">
              <p>Error: {error.message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please try again
              </p>
            </div>
          )}

          {debouncedQuery && data && filteredResults.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No results found for "{debouncedQuery}"</p>
              <p className="text-sm mt-2">Try different keywords</p>
            </div>
          )}

          {debouncedQuery && filteredResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredResults.map((item: any) => (
                  <SearchResultCard key={`${item.media_type}-${item.id}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
