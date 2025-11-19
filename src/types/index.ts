// Core domain types for WatchNext

export type TitleType = 'film' | 'series';

export interface Title {
  id: string;
  tmdb_id: number;
  title: string;
  type: TitleType;
  release_year: number;
  genres: string[];
  poster_url: string | null;
  overview: string;
  guardian_review_url: string | null;
  guardian_rating: number | null;
  guardian_review_excerpt: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  google_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface WatchHistoryEntry {
  id: string;
  user_id: string;
  title_id: string;
  title_type: TitleType;
  watched_date: string;
  rating: number; // 1-5 stars
  notes: string | null;
  created_at: string;
  // Joined data
  title?: Title;
}

export interface WatchlistEntry {
  id: string;
  user_id: string;
  title_id: string;
  title_type: TitleType;
  added_date: string;
  priority: number | null;
  created_at: string;
  // Joined data
  title?: Title;
}

export interface Recommendation {
  title: Title;
  score: number;
  reason: string;
}

// TMDB API Types
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
}

export interface TMDBSearchResult {
  page: number;
  results: (TMDBMovie | TMDBTVShow)[];
  total_pages: number;
  total_results: number;
}

// Guardian API Types
export interface GuardianReview {
  id: string;
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  fields?: {
    starRating?: string;
    bodyText?: string;
  };
}

export interface GuardianSearchResponse {
  response: {
    status: string;
    results: GuardianReview[];
    total: number;
  };
}
