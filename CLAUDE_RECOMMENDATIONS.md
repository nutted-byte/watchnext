# Claude AI Recommendations - Implementation Guide

## Overview

WatchNext uses Anthropic's Claude Haiku to power personalized film and TV recommendations. This document covers the implementation, cost optimization, troubleshooting, and future improvements.

## Architecture

### Two-Stage Approach

**Stage 1: Pre-Filtering (Traditional Scoring)**
- Reduces 100+ TMDB candidates down to top 40
- Saves 60-80% on Claude API costs
- Location: `src/lib/recommendations.ts`

**Stage 2: Claude AI Analysis**
- Claude Haiku analyzes top 40 candidates
- Generates personalized reasoning
- Location: `src/lib/claude-recommendations.ts`

## Implementation Details

### Stage 1: Pre-Filtering

```typescript
// src/lib/recommendations.ts

// Quality thresholds
const MIN_TMDB_RATING = 6.5;  // Minimum 6.5/10 on TMDB
const MIN_VOTE_COUNT = 50;    // At least 50 votes for credibility

// Scoring system (0-100 points)
- TMDB vote average: 0-20 points
- Guardian rating: 0-70 points (HEAVY WEIGHT)
  - 4-5 star Guardian: +40-50 points
  - Has Guardian rating: +20 bonus
- Genre matching: 0-30 points

// Guardian prioritization
- Top 30 with Guardian ratings
- Top 10 without Guardian ratings
- Total: 40 candidates → Claude
```

### Stage 2: Claude Analysis

```typescript
// src/lib/claude-recommendations.ts

Model: claude-3-haiku-20240307
Max tokens: 2048
Temperature: default

Input context (limited for cost):
- Watch history: 15 most recent (with ratings, notes, genres)
- Watchlist: 10 items
- Dismissed: 10 most recent
- Candidates: 40 titles (with genres, ratings, overview)

Output format:
[
  {
    "titleId": 123,
    "score": 85,
    "reasoning": "Because you watched Breaking Bad and rated it highly..."
  }
]
```

## Cost Optimization

### Current Strategy

1. **Pre-filtering saves 70% of costs**
   - Before: 100+ candidates
   - After: 40 candidates
   - Token reduction: ~60-80%

2. **Limited context**
   - Watch history: 15 items (not all)
   - Watchlist: 10 items (not all)
   - Dismissed: 10 items (most recent)
   - Overviews truncated: 150 chars

3. **Caching**
   - React Query: 5 minute cache
   - Recommendations only refresh when:
     - User rates new title (4-5 or 1-2 stars)
     - User manually clicks "Refresh Recommendations"

### Cost Breakdown (Estimated)

**Per recommendation request:**
- Input tokens: ~2000-2500 tokens
- Output tokens: ~500-800 tokens
- Cost per request: ~$0.0015-0.002 (Claude Haiku rates)

**With pre-filtering:**
- ~70% reduction in prompt size
- Cost per request: ~$0.0005-0.001

**Daily costs (single user):**
- 5 recommendation refreshes/day: ~$0.005/day
- Monthly: ~$0.15/user

## Reasoning Quality

### Prompt Engineering

The prompt includes explicit guidelines for reasoning:

```
REASONING GUIDELINES:
- Be specific: reference 1-2 titles from watch history
- Format: "Because you watched [Title] and rated it highly..."
- Example: "Because you watched The Wire and rated it highly this gritty crime drama has similar themes"
- Keep concise (under 120 characters)
- NO quotes, NO apostrophes in reasoning text
```

### JSON Sanitization

Claude sometimes returns smart quotes or malformed JSON. We handle this:

```typescript
// Aggressive JSON sanitization
sanitizedJson = sanitizedJson
  .replace(/[\u201C\u201D]/g, '"')      // Smart quotes → regular quotes
  .replace(/[\u2018\u2019]/g, '')      // Remove apostrophes
  .replace(/[\u2013\u2014]/g, '-')     // Em/en dashes → hyphens
  .replace(/\n/g, ' ')                 // Remove newlines
  .replace(/\s+/g, ' ')                // Collapse whitespace
```

## Troubleshooting

### Issue: Claude returns invalid JSON

**Symptoms:**
- Console errors: "Failed to parse Claude JSON response"
- Empty recommendations

**Solution:**
- Check `sanitizedJson` in console logs
- Claude might have added markdown code blocks
- JSON sanitization regex might need updating

**Prevention:**
- Prompt explicitly states: "Return ONLY valid JSON. No markdown, no explanations."

### Issue: Recommendations seem generic

**Symptoms:**
- Reasoning doesn't reference specific titles
- All recommendations score similarly

**Solution:**
- Check watch history has sufficient data (need 3+ rated titles)
- Verify genres are being extracted correctly
- Ensure dismissed recommendations are being passed

**Debug:**
```typescript
// Add to claude-recommendations.ts
console.log('Watch history sent to Claude:', watchHistory);
console.log('Candidates sent to Claude:', candidates);
```

### Issue: High API costs

**Symptoms:**
- Claude API bills higher than expected
- Token usage exceeding estimates

**Solution:**
- Check React Query cache settings (should be 5 min)
- Verify pre-filtering is working (should reduce to 40 candidates)
- Check for infinite loops or repeated calls

**Debug:**
```typescript
// Add to recommendations.ts
console.log('Candidates before filtering:', allCandidates.length);
console.log('Candidates sent to Claude:', topCandidates.length);
```

### Issue: Low-quality recommendations

**Symptoms:**
- Recommendations have low TMDB ratings
- Missing Guardian ratings

**Solution:**
- Verify quality filters are applied:
  ```typescript
  if (title.vote_average < 6.5) return false;
  if ((title.vote_count || 0) < 50) return false;
  ```
- Check Guardian prioritization (30 with, 10 without)
- Increase Guardian weight in scoring if needed

## Future Improvements

### Short Term

1. **Dynamic context limits**
   - Increase watch history limit when user has < 15 items
   - Decrease when user has 50+ items for cost savings

2. **Smarter caching**
   - Cache per type (film vs series) separately
   - Longer cache (10 min) for users with stable history

3. **A/B testing**
   - Test different pre-filter thresholds (6.0 vs 6.5 vs 7.0)
   - Test Guardian slot allocation (30/10 vs 25/15)

### Long Term

1. **Model upgrades**
   - Test Claude Sonnet for better reasoning (higher cost)
   - Compare with Claude Opus for premium users

2. **Hybrid approach**
   - Use Haiku for quick recommendations
   - Use Sonnet for "deep dive" analysis on demand

3. **Fine-tuning**
   - Collect user feedback on recommendations
   - Fine-tune model on successful recommendations

4. **Collaborative filtering**
   - Find users with similar taste
   - Include their highly-rated titles in candidate pool

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/recommendations.ts` | Stage 1: Pre-filtering and scoring |
| `src/lib/claude-recommendations.ts` | Stage 2: Claude API integration |
| `src/hooks/use-recommendations.ts` | React Query hooks and caching |
| `src/pages/films.tsx` | Films recommendations UI |
| `src/pages/series.tsx` | TV series recommendations UI |
| `src/components/custom/recommendation-detail-modal.tsx` | Shows reasoning |

## Environment Variables

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

⚠️ **Security Note**: Currently using `dangerouslyAllowBrowser: true` in development. For production, move Claude API calls to backend/serverless functions.

## Testing Recommendations

### Manual Testing Checklist

1. **New user (no history)**
   - Should show popular titles with Guardian ratings
   - No personalized reasoning expected

2. **User with 3-5 ratings**
   - Should see genre-based recommendations
   - Some reasoning should reference watched titles

3. **User with 10+ ratings**
   - Highly personalized recommendations
   - All reasoning should reference specific titles
   - Diverse genres unless user clearly prefers one

4. **Dismiss functionality**
   - Dismissed titles shouldn't reappear
   - Similar titles should be avoided

5. **Refresh button**
   - Should fetch new recommendations
   - Should show loading state
   - Should work without errors

### Performance Testing

```bash
# Monitor Claude API calls
# Check browser Network tab for:
# - POST to api.anthropic.com
# - Response time (should be < 5 seconds)
# - Token usage in response headers
```

## Monitoring

### Key Metrics to Track

1. **Recommendation acceptance rate**
   - % of recommendations added to watchlist
   - % of recommendations marked as watched
   - Target: 30%+ acceptance

2. **API costs**
   - Daily/monthly Claude API spend
   - Cost per user
   - Target: < $0.50/user/month

3. **Reasoning quality**
   - % of reasoning that references specific titles
   - User feedback on reasoning helpfulness
   - Target: 80%+ specific references

4. **Cache hit rate**
   - % of requests served from React Query cache
   - Target: 70%+ cache hits

## Summary

The Claude AI recommendation system uses a two-stage approach to balance quality and cost:
1. Pre-filter 100+ candidates → 40 best candidates (saves 70% cost)
2. Claude Haiku analyzes top 40 → generates personalized recommendations

Key success factors:
- Strict quality filters (6.5+ TMDB, 50+ votes)
- Heavy Guardian rating weight (70 points vs 20 for TMDB)
- Personalized "Because you watched X" reasoning
- Smart caching and dismissed recommendation tracking
- Cost-effective prompt engineering

Current cost: ~$0.15/user/month with 5 refreshes/day.
