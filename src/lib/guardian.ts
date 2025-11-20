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
  year?: number,
  type?: 'film' | 'series'
): Promise<GuardianReview[]> {
  // Add "tv series" or "television" to search for better TV results
  let searchQuery = title;
  if (type === 'series') {
    searchQuery = `${title} tv series`;
  }
  if (year) {
    searchQuery += ` ${year}`;
  }

  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.append('api-key', API_KEY);
  url.searchParams.append('q', searchQuery);

  // Set section and tag based on type
  if (type === 'series') {
    url.searchParams.append('section', 'tv-and-radio');
    url.searchParams.append('tag', 'tv-and-radio/tv-and-radio');
  } else if (type === 'film') {
    url.searchParams.append('section', 'film');
    url.searchParams.append('tag', 'film/film');
  } else {
    // Search both if type not specified
    url.searchParams.append('tag', 'film/film,tv-and-radio/tv-and-radio');
  }

  url.searchParams.append('show-fields', 'starRating,trailText,body');
  url.searchParams.append('page-size', '20'); // Increased to get more options
  url.searchParams.append('order-by', 'relevance');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('Guardian API error:', response.status);
      return [];
    }

    const data: GuardianSearchResult = await response.json();
    const results = data.response.results || [];

    console.log(`Guardian search for "${title}" (${type}): found ${results.length} results`);

    // Filter results to ensure they're from the correct section
    let filteredResults = results;
    if (type === 'series') {
      // Only accept results from tv-and-radio section
      filteredResults = results.filter(r => r.id.includes('tv-and-radio/'));
      console.log(`After filtering for tv-and-radio: ${filteredResults.length} results`);
      if (filteredResults.length > 0) {
        console.log(`First TV result: ${filteredResults[0].webUrl}`);
      }
    } else if (type === 'film') {
      // Only accept results from film section
      filteredResults = results.filter(r => r.id.includes('film/'));
    }

    return filteredResults;
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

// Check if Guardian review title matches the show/film title
function isReviewForTitle(reviewTitle: string, targetTitle: string): boolean {
  const cleanReview = reviewTitle.toLowerCase()
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanTarget = targetTitle.toLowerCase()
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Check if target title appears in review title
  if (cleanReview.includes(cleanTarget)) {
    return true;
  }

  // Check if all significant words from target appear in review
  const targetWords = cleanTarget.split(' ').filter(w => w.length > 2);
  const reviewWords = cleanReview.split(' ');

  // At least 70% of significant words should match
  const matchCount = targetWords.filter(word => reviewWords.includes(word)).length;
  const matchRatio = matchCount / targetWords.length;

  return matchRatio >= 0.7;
}

// Get best matching review for a title
export async function getBestGuardianReview(
  title: string,
  year?: number,
  type?: 'film' | 'series'
): Promise<{
  url: string | null;
  rating: number | null;
  excerpt: string | null;
}> {
  const reviews = await searchGuardianReviews(title, year, type);

  if (reviews.length === 0) {
    console.log(`No Guardian ${type} reviews found for "${title}"`);
    return { url: null, rating: null, excerpt: null };
  }

  // Find reviews that match the title and have the correct section
  const matchingReviews = reviews.filter(review => {
    // Check correct section
    const isCorrectSection = type === 'series'
      ? review.id.includes('tv-and-radio/')
      : type === 'film'
      ? review.id.includes('film/')
      : true;

    if (!isCorrectSection) {
      return false;
    }

    // Check if review title matches our title
    const titleMatches = isReviewForTitle(review.webTitle, title);

    if (titleMatches) {
      console.log(`✓ Guardian review title matches: "${review.webTitle}" for "${title}"`);
    } else {
      console.log(`✗ Guardian review title doesn't match: "${review.webTitle}" for "${title}"`);
    }

    return titleMatches;
  });

  if (matchingReviews.length === 0) {
    console.warn(`No matching Guardian ${type} reviews found for "${title}"`);
    return { url: null, rating: null, excerpt: null };
  }

  // Prioritize reviews with star ratings
  const reviewsWithRatings = matchingReviews.filter(r => r.fields?.starRating);
  const bestReview = reviewsWithRatings.length > 0 ? reviewsWithRatings[0] : matchingReviews[0];

  console.log(`✓ Using Guardian ${type} review for "${title}": ${bestReview.webUrl}`);

  return {
    url: bestReview.webUrl,
    rating: extractStarRating(bestReview),
    excerpt: bestReview.fields?.trailText || null,
  };
}
