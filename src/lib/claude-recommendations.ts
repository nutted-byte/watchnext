import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/config/env';

const anthropic = new Anthropic({
  apiKey: env.anthropic.apiKey,
  dangerouslyAllowBrowser: true, // Only for development - move to backend in production
});

interface WatchHistoryItem {
  title: string;
  rating: number; // 1-5 stars
  notes?: string;
  year?: number;
  genres?: string[];
}

interface CandidateTitle {
  id: number;
  title: string;
  year?: number;
  overview: string;
  genres?: number[];
  voteAverage?: number;
  guardianRating?: number;
}

export interface ClaudeRecommendation {
  titleId: number;
  score: number;
  reasoning: string;
}

export async function getClaudeRecommendations(
  watchHistory: WatchHistoryItem[],
  watchlist: string[],
  candidates: CandidateTitle[],
  limit: number = 20
): Promise<ClaudeRecommendation[]> {
  // Prepare context for Claude
  const watchedHighlyRated = watchHistory
    .filter((item) => item.rating >= 4)
    .map((item) => `"${item.title}" (${item.year}) - ${item.rating}/5 stars${item.notes ? ` - Notes: ${item.notes}` : ''}`)
    .join('\n');

  const watchedLowRated = watchHistory
    .filter((item) => item.rating <= 2)
    .map((item) => `"${item.title}" (${item.year}) - ${item.rating}/5 stars${item.notes ? ` - Notes: ${item.notes}` : ''}`)
    .join('\n');

  const watchlistText = watchlist.join(', ');

  const candidatesText = candidates
    .map(
      (c, idx) =>
        `${idx + 1}. [ID:${c.id}] "${c.title}" (${c.year}) - ${c.overview.slice(0, 150)}...${c.guardianRating ? ` | Guardian: ${c.guardianRating}/5★` : ''} | TMDB: ${c.voteAverage?.toFixed(1) || 'N/A'}/10`
    )
    .join('\n');

  const prompt = `You are an expert film and TV recommendation system. Analyze the user's viewing history and recommend titles from the candidate list.

## User's Highly Rated Content (4-5 stars):
${watchedHighlyRated || 'None yet'}

## User's Low Rated Content (1-2 stars):
${watchedLowRated || 'None yet'}

## User's Watchlist:
${watchlistText || 'Empty'}

## Candidate Titles to Evaluate:
${candidatesText}

TASK: Recommend the top ${limit} titles from the candidate list that best match this user's taste. Consider:
1. What patterns do you see in their highly-rated content? (themes, genres, tone, era)
2. What did they dislike? (avoid similar titles)
3. Guardian ratings (high Guardian scores often indicate quality)
4. Diversity (don't just recommend one type)

Return ONLY a valid JSON array. No markdown, no explanations, just the JSON array.

Format each object exactly like this:
{"titleId": 123, "score": 85, "reasoning": "Simple explanation without any quotes or special characters"}

CRITICAL RULES:
1. Use double quotes for all JSON keys and string values
2. In reasoning text: NO quotes, NO apostrophes, NO special characters
3. Write it is instead of it's, write Breaking Bad without quotes
4. Separate objects with commas
5. The entire response must be valid JSON

Return exactly ${limit} recommendations ordered by score (highest first).`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Claude response did not contain valid JSON array');
      console.error('Response:', responseText);
      return [];
    }

    // Aggressive JSON sanitization
    let sanitizedJson = jsonMatch[0];

    // Step 1: Replace smart quotes and special characters
    sanitizedJson = sanitizedJson
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, '')  // Remove apostrophes entirely
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Step 2: Fix each object individually using regex
    sanitizedJson = sanitizedJson.replace(
      /\{"titleId":\s*(\d+),\s*"score":\s*(\d+),\s*"reasoning":\s*"([^"}]*?)"\s*\}/g,
      (match, titleId, score, reasoning) => {
        // Clean reasoning: remove any quotes/apostrophes
        const cleanReasoning = reasoning.replace(/['"]/g, '');
        return `{"titleId":${titleId},"score":${score},"reasoning":"${cleanReasoning}"}`;
      }
    );

    // Step 3: Fix any objects missing closing quotes
    sanitizedJson = sanitizedJson.replace(
      /\{"titleId":\s*(\d+),\s*"score":\s*(\d+),\s*"reasoning":\s*"([^"}]*?)\}/g,
      '{"titleId":$1,"score":$2,"reasoning":"$3"}'
    );

    try {
      const recommendations: ClaudeRecommendation[] = JSON.parse(sanitizedJson);

      // Validate and return
      return recommendations.filter(
        (rec) =>
          typeof rec.titleId === 'number' &&
          typeof rec.score === 'number' &&
          typeof rec.reasoning === 'string'
      );
    } catch (parseError) {
      console.error('Failed to parse Claude JSON response');
      console.error('Raw JSON:', jsonMatch[0]);
      console.error('Sanitized JSON:', sanitizedJson);
      console.error('Parse error:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return [];
  }
}
