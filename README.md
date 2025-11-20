# WatchNext

**Personalized TV & Film Recommendation Service**

WatchNext answers "What should I watch next?" by learning from your viewing history and using AI to generate personalized recommendations.

## Features

- **AI-Powered Recommendations**: Claude AI analyzes your watch history to recommend films and TV series you'll genuinely enjoy
- **Personalized Reasoning**: Each recommendation explains why it's a good match ("Because you watched X and rated it highly...")
- **Guardian Integration**: Recommendations prioritize Guardian-reviewed content for quality curation
- **Watch History**: Track what you've watched with 5-star ratings and notes
- **Watchlist Management**: Save titles you want to watch with quick add/remove functionality
- **Smart Search**: Search TMDB's extensive database of films and TV series
- **Dismiss & Refresh**: Dismiss recommendations you're not interested in and refresh for new suggestions

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth via Supabase Auth
- **AI**: Anthropic Claude (Haiku) for recommendations
- **APIs**: TMDB API, The Guardian API
- **Hosting**: Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- TMDB API key
- Guardian API key
- Anthropic API key

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_GUARDIAN_API_KEY=your_guardian_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_APP_URL=http://localhost:5173
```

### Installation

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## Architecture Highlights

### AI Recommendation System

The recommendation engine uses a two-stage approach:

1. **Pre-filtering**: Traditional scoring reduces candidates from 100+ to top 40 (70% cost reduction)
   - TMDB quality threshold: 6.5+ rating, 50+ votes
   - Guardian rating prioritization: 30 slots for Guardian-reviewed, 10 for others
   - Genre matching with user preferences

2. **Claude AI Analysis**: Claude Haiku analyzes the top 40 candidates
   - Considers watch history (ratings, genres, notes)
   - References specific titles user rated highly
   - Avoids dismissed recommendations
   - Generates personalized reasoning

### Key Files

- `src/lib/recommendations.ts` - Main recommendation algorithm
- `src/lib/claude-recommendations.ts` - Claude AI integration
- `src/hooks/use-recommendations.ts` - React Query hooks
- `src/pages/films.tsx` & `src/pages/series.tsx` - Main UI pages

## Recommendation Quality

- Strict TMDB filtering (6.5+ rating, 50+ votes minimum)
- Guardian-reviewed content heavily prioritized
- "Because you watched X" reasoning for each recommendation
- Dismissable recommendations stored to avoid repeats
- Refresh button to clear cache and fetch new suggestions

## Documentation

- [Product Requirements Document](PRD.md) - Full product specification
- [TODO List](TODO.md) - Development progress tracker

## License

MIT
