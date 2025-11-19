import { env } from '@/config/env';

const BASE_URL = env.guardian.baseUrl;
const API_KEY = env.guardian.apiKey;

interface GuardianReview {
  id: string;
  webTitle: string;
  webUrl: string;
  fields?: {
    starRating?: string;
    trailText?: string;
    body?: string;
  };
}

interface GuardianSearchResult {
  response: {
    status: string;
    results: GuardianReview[];
    total: number;
  };
}

// Search for Guardian reviews of a film/TV show
export async function searchGuardianReviews(
  title: string,
  year?: number
): Promise<GuardianReview[]> {
  const searchQuery = year ? `${title} ${year}` : title;

  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.append('api-key', API_KEY);
  url.searchParams.append('q', searchQuery);
  url.searchParams.append('section', 'film');
  url.searchParams.append('tag', 'film/film,tv-and-radio/tv-and-radio');
  url.searchParams.append('show-fields', 'starRating,trailText,body');
  url.searchParams.append('page-size', '10');
  url.searchParams.append('order-by', 'relevance');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('Guardian API error:', response.status);
      return [];
    }

    const data: GuardianSearchResult = await response.json();
    return data.response.results || [];
  } catch (error) {
    console.error('Error fetching Guardian reviews:', error);
    return [];
  }
}

// Extract star rating from Guardian review (1-5)
export function extractStarRating(review: GuardianReview): number | null {
  if (!review.fields?.starRating) return null;

  const rating = parseInt(review.fields.starRating);
  console.log('Guardian star rating:', review.fields.starRating, '→', rating);

  if (isNaN(rating) || rating < 1 || rating > 5) {
    console.warn('Invalid Guardian rating:', rating);
    return null;
  }

  return rating;
}

// Get best matching review for a title
export async function getBestGuardianReview(
  title: string,
  year?: number
): Promise<{
  url: string | null;
  rating: number | null;
  excerpt: string | null;
}> {
  const reviews = await searchGuardianReviews(title, year);

  if (reviews.length === 0) {
    return { url: null, rating: null, excerpt: null };
  }

  // Prioritize reviews with star ratings
  const reviewsWithRatings = reviews.filter(r => r.fields?.starRating);
  const bestReview = reviewsWithRatings.length > 0 ? reviewsWithRatings[0] : reviews[0];

  return {
    url: bestReview.webUrl,
    rating: extractStarRating(bestReview),
    excerpt: bestReview.fields?.trailText || null,
  };
}
