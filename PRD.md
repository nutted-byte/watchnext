# Product Requirements Document: WatchNext

## 1. Product Overview

### 1.1 Product Name
**WatchNext** - Personalized TV & Film Recommendation Service

### 1.2 Product Vision
A clean, intuitive web application that answers "What should I watch next?" by learning from your viewing history and cross-referencing with quality reviews from The Guardian, helping users discover films and TV series they'll genuinely enjoy.

### 1.3 Target Users
- Film and TV enthusiasts who consume content across multiple streaming platforms
- Users who value quality curation and critical perspective
- People overwhelmed by choice across streaming services

### 1.4 Success Metrics
- User engagement: Average session duration and return visits
- Recommendation acceptance rate: % of recommended content marked as watched
- User satisfaction: Average rating of watched content
- Time to decision: Reduction in time spent browsing for content

---

## 2. Core Features

### 2.1 Personalized Recommendations
**User Story**: As a user, I want personalized film/TV recommendations based on my viewing history so I can quickly find quality content I'll enjoy.

**Acceptance Criteria**:
- System analyzes user's watch history (titles, ratings, genres)
- Cross-references The Guardian reviews as quality proxy
- Presents 3-5 top recommendations on homepage
- Filters by availability (assumes access to all streaming services)
- Explains why each title is recommended
- Allows filtering by film vs TV series

### 2.2 Watch History Management
**User Story**: As a user, I want to track what I've watched and how I felt about it so the system learns my preferences.

**Acceptance Criteria**:
- Add titles to "Watched" list
- Rate watched content (simple like/dislike or 5-star system)
- View complete watch history with filters (date, rating, type)
- Edit/remove entries from history
- Add optional notes/thoughts on titles

### 2.3 Watchlist Management
**User Story**: As a user, I want to easily save titles I'm interested in watching so I can build a curated queue.

**Acceptance Criteria**:
- Add titles manually via search
- Add titles via photo upload (OCR from reviews/IMDB pages)
- View watchlist with sorting options
- Move titles from watchlist to watched
- Remove titles from watchlist
- See Guardian review score on watchlist items

### 2.4 Photo-Based Entry
**User Story**: As a user, I want to add films/shows by taking a photo of a review or IMDB page so I can quickly capture recommendations I encounter.

**Acceptance Criteria**:
- Upload photo via mobile or desktop
- OCR extracts title from image
- System searches and confirms correct title
- User confirms before adding to watchlist
- Handles multiple titles in one image
- Works with Guardian reviews, IMDB pages, and general text

### 2.5 The Guardian Integration
**User Story**: As a user, I want recommendations filtered by Guardian review quality so I'm more likely to watch acclaimed content.

**Acceptance Criteria**:
- Fetch Guardian review scores for titles
- Display review excerpt and link on title pages
- Filter recommendations by minimum review threshold
- Show Guardian rating in search results
- Handle titles without Guardian reviews gracefully

---

## 3. Technical Architecture

### 3.1 Tech Stack
- **Frontend**: React 19 (latest stable version) + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS v4
- **Hosting**: Netlify
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth via Supabase Auth
- **Version Control**: GitHub
- **External APIs**:
  - **Anthropic Claude API** (Haiku model for AI recommendations)
  - **The Guardian Open Platform API** (quality reviews)
  - **TMDB API** (film/TV metadata and search)
  - OCR API (Google Vision API or similar) - Future enhancement

### 3.2 Database Schema

#### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  google_id TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Titles Table
```sql
titles (
  id UUID PRIMARY KEY,
  tmdb_id INTEGER UNIQUE,
  title TEXT,
  type TEXT, -- 'film' or 'series'
  release_year INTEGER,
  genres TEXT[],
  poster_url TEXT,
  overview TEXT,
  guardian_review_url TEXT,
  guardian_rating INTEGER,
  guardian_review_excerpt TEXT,
  created_at TIMESTAMP
)
```

#### Watch History Table
```sql
watch_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title_id UUID REFERENCES titles(id),
  title_type TEXT CHECK (title_type IN ('film', 'series')), -- Separate tracking
  watched_date DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 5-star rating system (aligns with Guardian)
  notes TEXT,
  created_at TIMESTAMP,
  UNIQUE(user_id, title_id)
)
```

#### Watchlist Table
```sql
watchlist (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title_id UUID REFERENCES titles(id),
  title_type TEXT CHECK (title_type IN ('film', 'series')), -- Separate lists
  added_date DATE,
  priority INTEGER,
  created_at TIMESTAMP,
  UNIQUE(user_id, title_id)
)
```

### 3.3 Design System Requirements

#### Design Tokens
All styling must use design tokens defined in a central configuration:

**Color Tokens**:
- `--color-primary`: Main brand color
- `--color-secondary`: Accent color
- `--color-background`: Page background
- `--color-surface`: Card/component background
- `--color-text-primary`: Main text color
- `--color-text-secondary`: Subdued text
- `--color-border`: Border color
- `--color-success`: Positive actions/feedback
- `--color-error`: Error states

**Spacing Tokens**:
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 16px
- `--spacing-lg`: 24px
- `--spacing-xl`: 32px
- `--spacing-2xl`: 48px

**Typography Tokens**:
- `--font-family-primary`: Main font
- `--font-size-xs`: 12px
- `--font-size-sm`: 14px
- `--font-size-md`: 16px
- `--font-size-lg`: 20px
- `--font-size-xl`: 24px
- `--font-size-2xl`: 32px
- `--font-weight-regular`: 400
- `--font-weight-medium`: 500
- `--font-weight-bold`: 700

**Border Radius Tokens**:
- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-full`: 9999px

#### Component Library (shadcn/ui)
All UI components will be built using **shadcn/ui** (MIT License - free and open-source) as the foundation, customized with our design tokens.

**Why shadcn/ui**:
- Free and open-source (MIT License)
- Built on Radix UI (accessible by default)
- Fully customizable with Tailwind CSS
- Copy-paste components (own the code)
- TypeScript native
- Excellent documentation

**Core Components** (from shadcn/ui):
- `Button` (primary, secondary, ghost, outline variants)
- `Card` (for title displays)
- `Input` (text input with validation states)
- `Textarea` (for notes)
- `Select` (dropdown)
- `Dialog` (for confirmations, detail views)
- `Badge` (for genres, ratings)
- `Skeleton` (loading states)
- `Toast` / `Sonner` (notifications)
- `Avatar` (user profile)
- `Tabs` (navigation between views)
- `Command` (search with autocomplete)
- `DropdownMenu` (user menu)

**Custom Components** (built on shadcn/ui):
- `TitleCard` (extends Card for film/TV display)
- `Rating` (star rating using shadcn/ui buttons)
- `FileUpload` (photo upload for OCR)
- `GuardianBadge` (Guardian review indicator)
- `RecommendationCard` (extends TitleCard with recommendation reason)

**Component Customization Rules**:
1. All shadcn/ui components must be configured with our design tokens via Tailwind config
2. Use CSS variables for theming (shadcn/ui's default approach)
3. Extend components via composition, not modification of source
4. All custom components must follow shadcn/ui patterns (forwardRef, variants via class-variance-authority)
5. Components must support dark/light mode via CSS variable switching
6. Maintain accessibility standards (shadcn/ui provides this by default)

### 3.4 Letterboxd-Inspired Design Language

**Key Design Principles**:
- Clean, minimal interface with generous whitespace
- Grid-based layout for title displays
- Prominent poster imagery
- Subtle shadows and borders
- Muted, sophisticated color palette
- Clear typography hierarchy
- Smooth transitions and micro-interactions

**Color Palette** (inspired by Letterboxd):
- Primary: Deep teal/blue-gray (#14181c - dark) or (#445566)
- Accent: Warm orange/gold (#ff8000)
- Background: Off-white (#fafafa) or dark (#1c2127)
- Surface: Pure white (#ffffff) or elevated dark (#2c3440)
- Text: Near-black (#222) or off-white (#e0e0e0)

---

## 4. User Flows

### 4.1 Initial Setup Flow
1. User lands on homepage (logged out state)
2. Clicks "Sign in with Google"
3. Completes Google OAuth flow
4. Redirected to onboarding
5. Prompted to add films they've enjoyed (minimum 3)
6. Prompted to add TV series they've enjoyed (minimum 3)
7. System generates initial recommendations (separate for films and TV)
8. User arrives at main dashboard with choice: Films or TV Series

### 4.2 Adding to Watchlist (Photo)
1. User clicks "Add from Photo" button
2. Camera/file picker opens
3. User captures/selects photo
4. System processes OCR → extracts single title
5. Displays extracted title with poster for confirmation
6. User confirms or edits title
7. Title added to watchlist with success toast
8. Immediately returns to "Add from Photo" flow for next title (if desired)

### 4.3 Marking as Watched
1. User finds title (from watchlist or recommendation)
2. Clicks "Mark as Watched"
3. Rating modal appears
4. User selects rating and optionally adds notes
5. Title moved to watch history
6. Recommendations refresh

### 4.4 Getting Recommendations
1. User visits homepage/recommendations tab
2. System displays 3-5 personalized recommendations
3. Each card shows: poster, title, year, Guardian rating, reason for recommendation
4. User can: add to watchlist, mark as watched, dismiss, or view details
5. Clicking title opens detail modal with full info and Guardian review

---

## 5. Pages/Views

### 5.1 Navigation Structure

**Primary Navigation** (Always visible):
- Films
- TV Series
- Search
- Profile

**Sub-navigation** (within Films and TV Series):
- Recommendations (default view)
- Watchlist
- History

### 5.2 Homepage (Authenticated)
- User chooses: "What are you in the mood for?"
- Two large cards: "Films" and "TV Series"
- Clicking either goes to that section's Recommendations page
- Quick stats: "X films watched" | "Y series watched"
- Recent activity feed (mixed films and TV)

### 5.3 Films Section

**Films → Recommendations**
- Hero: Top film recommendation of the day
- Grid: 5 film recommendations
- Filter: Genre, minimum Guardian rating, year
- All recommendations are films only

**Films → Watchlist**
- Grid of films in watchlist
- Sort: Date added, alphabetical, Guardian rating
- Filter: Genre, year
- Empty state: "Your film watchlist is empty"

**Films → History**
- Grid of watched films with ratings
- Sort: Watch date, rating, title
- Filter: Rating, genre, year
- Stats: Films watched, avg rating, favorite genres

### 5.4 TV Series Section

**TV Series → Recommendations**
- Hero: Top series recommendation of the day
- Grid: 5 series recommendations
- Filter: Genre, minimum Guardian rating, year
- All recommendations are TV series only

**TV Series → Watchlist**
- Grid of series in watchlist
- Sort: Date added, alphabetical, Guardian rating
- Filter: Genre, year
- Empty state: "Your TV series watchlist is empty"

**TV Series → History**
- Grid of watched series with ratings
- Sort: Watch date, rating, title
- Filter: Rating, genre, year
- Stats: Series watched, avg rating, favorite genres

### 5.5 Search Page
- Single search box searches both films AND TV
- Results show type badge (Film/Series)
- Filter toggle: "Films only" | "TV only" | "Both" (default)
- Results in mixed grid with clear type indicators

### 5.6 Title Detail Modal/Page
- Large poster image
- Type badge: "Film" or "TV Series"
- Full metadata (year, runtime/seasons, genres)
- Overview/synopsis
- Guardian review (excerpt + link)
- Actions: Add to watchlist, mark as watched, rate
- Streaming availability (all services)

### 5.7 Profile/Settings Page
- Display name edit
- Recommendation preferences (separate for films and TV)
- Export watch history (films and TV separately)
- Sign out
- Delete account

---

## 6. API Requirements

### 6.1 The Guardian API
- **Endpoint**: `/search` for film/TV reviews
- **Data needed**: Review rating, excerpt, URL, publication date
- **Rate limits**: Free tier - 12 requests per second
- **Caching strategy**: Cache reviews for 30 days

### 6.2 TMDB API
- **Endpoints**: `/search/movie`, `/search/tv`, `/movie/{id}`, `/tv/{id}`
- **Data needed**: Title, poster, genres, overview, release date, streaming providers
- **Rate limits**: 40 requests per 10 seconds
- **Caching strategy**: Cache title metadata indefinitely

### 6.3 OCR API (Google Vision or alternative)
- **Endpoint**: Text detection from image
- **Usage**: Extract titles from photos
- **Cost consideration**: Free tier limits
- **Fallback**: Manual entry if OCR fails

---

## 7. Recommendation Algorithm

### 7.1 Current Approach (AI-Powered with Strict Quality Control)

**Rating System**: 5-star ratings (aligns with Guardian review format)
- 5 stars = Loved it
- 4 stars = Really enjoyed it
- 3 stars = It was fine
- 2 stars = Didn't enjoy it
- 1 star = Disliked it

**Three-Stage Recommendation Engine**:

#### Stage 1: Recent Candidate Discovery
Fetch ~150-200 recent, quality candidates from TMDB

**TMDB Filters**:
- **Recency Filter**: Only titles from past 5 years (2020-2025)
- Sort by: `popularity.desc` (trending recent titles)
- TMDB rating ≥ 6.0/10
- Vote count ≥ 50 (ensures credibility)
- Genre match: User's preferred genres (from 3+ star ratings)
- Fetch 3 pages × multiple sources = ~150-200 candidates
- Not in watch history, watchlist, or dismissed

**Why Recent Only?**
- Users prefer contemporary content
- Guardian reviews more available for recent titles
- Better reflects current viewing preferences

#### Stage 2: Guardian Enrichment & Strict Quality Filter
Enrich top 100 candidates with Guardian reviews, then apply strict 4-5 star filter

**Guardian Enrichment**:
1. Take top 100 candidates (by TMDB rating)
2. Check database for existing Guardian ratings
3. Fetch fresh Guardian reviews for titles without ratings
4. Store all Guardian ratings in database for future use

**STRICT FILTER: 4-5 Star Guardian Ratings ONLY**
- **Filter out ALL titles without Guardian reviews**
- **Filter out ALL titles with 1-3 star Guardian ratings**
- Only 4-5 star Guardian-reviewed titles proceed

**Scoring Factors** (for remaining 4-5 star titles):
1. **Genre match** (0-60 points) - **HIGHEST WEIGHT**
   - Based on genres from titles you've rated 3+ stars
   - 20 points per matching genre (up to 3 top genres)
   - Most personalized signal from your actual viewing habits
2. **Guardian rating** (40-50 points):
   - 4 stars = +40 points
   - 5 stars = +50 points
3. **Recency bias** (0-20 points):
   - Current year: +20 points
   - 1 year old: +15 points
   - 2 years old: +10 points
   - 3 years old: +5 points
   - 4+ years old: 0 points
4. **TMDB vote average** (0-20 points): Quality baseline

**Result**: Top 40 high-quality, recent titles with 4-5 star Guardian ratings

#### Stage 3: Claude AI Personalization
Claude Haiku (fast, cost-effective) analyzes the top 40 candidates (all with 4-5 star Guardian ratings)

**Input Context**:
- User's watch history (up to 15 recent, with ratings and notes)
- User's watchlist (up to 10 items)
- Dismissed recommendations (up to 10 recent)
- 40 candidate titles (all 4-5 star Guardian-reviewed, with genres and ratings)

**Claude's Task**:
1. Identify patterns in highly-rated content (themes, genres, tone, era)
2. Identify what user dislikes from low-rated content
3. Avoid titles similar to dismissed recommendations
4. Ensure diversity (not just one genre or theme)
5. Generate top 20 recommendations with scores (0-100)
6. Provide personalized reasoning for each recommendation

**Reasoning Format**:
- **Personalized**: "Because you watched [Title] and rated it highly..."
- **Specific**: References 1-2 titles from user's watch history
- **Concise**: Under 120 characters
- **Actionable**: Clear explanation of why it's a good match

**Output**:
```json
[
  {
    "titleId": 12345,
    "score": 92,
    "reasoning": "Because you watched Breaking Bad and rated it highly this gritty crime drama has similar themes"
  }
]
```

**Final Result**: Top 20 personalized recommendations
- All have 4-5 star Guardian ratings (quality guaranteed)
- All from past 5 years (recency guaranteed)
- Sorted by Claude's relevance score
- Each includes AI-generated reasoning

### 7.2 Key Design Decisions

**Why 4-5 Star Guardian Ratings ONLY?**
- Ensures consistently high-quality recommendations
- Guardian reviews are curated, critical perspective (not user reviews)
- Users prefer quality over quantity
- Reduces decision fatigue - every recommendation is worth watching

**Why Recent Titles Only (Past 5 Years)?**
- User preference for contemporary content
- Better Guardian review coverage for recent titles
- Reflects current cultural context and viewing trends
- Scoring still prioritizes past 3 years most heavily

**Why Genre Match is Highest Weighted?**
- Most reliable indicator of user preference
- Based on actual viewing behavior (what you've rated 3+ stars)
- More personal than generic popularity or ratings
- Prevents recommendation fatigue from same type of content

### 7.3 Cost Optimization

**Three-stage approach reduces Claude API costs by 70-80%**:
- Stage 1: TMDB filters ~150-200 candidates → 100 candidates
- Stage 2: Guardian enrichment → 40 high-quality candidates (4-5 stars)
- Stage 3: Claude analyzes only 40 candidates (vs 150+ without filtering)
- Token savings: ~70-80% reduction in prompt size

**Caching Strategy**:
- React Query caches recommendations for 5 minutes
- User can manually refresh via "Refresh Recommendations" button
- Cache invalidates when user rates new title (significant preference signal)
- Guardian ratings cached in database permanently (reduces API calls)

### 7.4 Dismissed Recommendations

**User Dismissal**:
- User can dismiss recommendations they're not interested in
- Dismissed titles stored in `dismissed_recommendations` table
- Context passed to Claude: "Previously Dismissed Recommendations"
- Claude avoids similar themes/genres/styles to dismissed titles

**Benefits**:
- Reduces repetitive recommendations
- Helps Claude learn user's taste more precisely
- Improves recommendation quality over time

### 7.5 Implementation Location

**File**: `src/lib/recommendations.ts`

**Key Functions**:
- `getRecommendations()` - Main entry point (lines 304-490)
- `getUserGenrePreferences()` - Analyzes watch history for genre preferences (lines 34-73)
- `enrichCandidatesWithGuardian()` - Fetches Guardian reviews (lines 200-250)
- `getClaudeRecommendations()` - AI personalization (in `claude-recommendations.ts`)

**UI Indicators**:
- Films/Series recommendation pages show badges:
  - "Recent releases prioritized (past 3 years)"
  - "4-5 star Guardian ratings only"

### 7.6 Future Enhancements
- Collaborative filtering (what similar users enjoyed)
- Mood-based recommendations
- Viewing occasion tags (quick watch, weekend binge, etc.)
- Director/actor preferences
- Decade preferences
- Upgrade to Claude Opus for deeper analysis (if budget allows)

---

## 8. Non-Functional Requirements

### 8.1 Performance
- Initial page load: < 2 seconds
- Search results: < 500ms
- Image upload OCR: < 5 seconds
- Smooth 60fps animations

### 8.2 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation throughout
- Screen reader compatible
- Sufficient color contrast (4.5:1 for text)
- Focus indicators on all interactive elements

### 8.3 Responsiveness
- Mobile-first design
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- Touch-friendly targets (min 44x44px)

### 8.4 Security
- HTTPS only
- Secure Google OAuth implementation
- Supabase Row Level Security (RLS) policies
- Input sanitization for user-generated content
- Rate limiting on API endpoints
- Environment variables for all secrets

### 8.5 SEO (Future)
- Server-side rendering for public pages
- OpenGraph meta tags
- Structured data for titles

---

## 9. Development Phases

### Phase 1: MVP (Weeks 1-3)
- Google authentication
- Basic database schema and Supabase setup
- Manual title search and add to watchlist
- Mark as watched with simple rating
- Basic recommendation algorithm
- Clean Letterboxd-inspired UI with design system foundation
- Homepage, watchlist, and history views

### Phase 2: Core Features (Weeks 4-6)
- Guardian API integration
- Enhanced recommendations algorithm
- Title detail views
- Photo upload and OCR
- Filtering and sorting
- User preferences

### Phase 3: Polish (Weeks 7-8)
- Animations and micro-interactions
- Performance optimization
- Comprehensive testing
- Mobile optimization
- Error handling and edge cases
- Analytics integration

### Phase 4: Future Enhancements
- Social features (share watchlist, follow friends)
- Advanced algorithm with collaborative filtering
- Browser extension for adding titles
- Mobile app
- Watchlist sharing and collaborative lists

---

## 10. Design System Implementation Guide

### 10.1 Project Structure
```
src/
  components/
    ui/                    # shadcn/ui components
      button.tsx
      card.tsx
      input.tsx
      dialog.tsx
      [etc...]
    custom/                # custom components
      title-card.tsx
      rating.tsx
      guardian-badge.tsx
      recommendation-card.tsx
  lib/
    utils.ts              # cn() utility for className merging
  styles/
    globals.css           # Tailwind + CSS variables for themes
  hooks/
    useTheme.ts
    useBreakpoint.ts
```

### 10.2 Design Token Implementation (Tailwind + CSS Variables)
shadcn/ui uses CSS variables for theming, which we'll customize in `globals.css`:

```css
:root {
  /* Colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 195 100% 28%;        /* Deep teal/blue-gray */
  --primary-foreground: 0 0% 100%;
  --secondary: 28 100% 50%;       /* Warm orange/gold */
  --secondary-foreground: 0 0% 0%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 28 100% 50%;
  --accent-foreground: 0 0% 0%;
  --border: 214.3 31.8% 91.4%;
  --ring: 195 100% 28%;

  /* Spacing (via Tailwind) */
  /* Use Tailwind's default spacing scale */

  /* Typography (via Tailwind config) */
  /* Configure in tailwind.config.ts */

  /* Shadows (via Tailwind) */
  /* Use Tailwind's shadow utilities */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 195 100% 35%;
  --primary-foreground: 0 0% 100%;
  /* ... dark mode values */
}
```

**Tailwind Config** (`tailwind.config.ts`):
```typescript
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... shadcn/ui color system
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 10.3 Token Usage Rules (shadcn/ui Approach)
1. **Use Tailwind utilities**: `className="px-4 py-2 bg-primary text-primary-foreground"`
2. **CSS variables for themes**: Colors defined in CSS, referenced via Tailwind
3. **cn() utility for conditional classes**: `cn("base-class", condition && "conditional-class")`
4. **Component variants**: Use class-variance-authority (cva) for component variants
5. **Consistent spacing**: Stick to Tailwind's spacing scale (4, 8, 16, 24, 32px)

### 10.4 Component Development Checklist (shadcn/ui)
For each component:
- [ ] Initialized via `npx shadcn@latest add <component>`
- [ ] Customized with brand colors via CSS variables
- [ ] TypeScript types defined (shadcn provides these)
- [ ] Supports dark mode (via .dark class)
- [ ] Accessible (Radix UI provides this)
- [ ] Responsive utilities applied
- [ ] Loading states defined
- [ ] Error states defined
- [ ] Documented with usage examples

---

## 11. Success Criteria

### Launch Criteria (MVP)
- All Phase 1 features functional
- Zero critical bugs
- Performance benchmarks met
- Accessible on mobile and desktop
- Google authentication working
- Guardian API integrated
- At least 10 beta testers successfully using product

### 6-Month Success Metrics
- 100+ active users
- 70%+ recommendation acceptance rate
- Average session duration > 5 minutes
- 3+ return visits per week per user
- User satisfaction score > 4/5

---

## 12. Open Questions & Decisions Needed

1. ~~**Rating system**: 5-star or simple like/dislike?~~ ✅ **DECIDED: 5-star system (aligns with Guardian)**
2. **Public profiles**: Should users have public profiles/watchlists?
3. **Social features**: Share recommendations with friends?
4. **Streaming availability**: Show which specific service has each title?
5. **Content freshness**: How often to refresh Guardian reviews?
6. **Mobile app**: PWA sufficient or native app needed later?
7. **Monetization**: Free forever, freemium, or subscription?
8. **Data portability**: Allow import from Letterboxd, IMDB?

---

## 13. Constraints & Assumptions

### Constraints
- Free tier API limits (Guardian, TMDB)
- OCR accuracy may vary with image quality
- Guardian doesn't review all content (handle gracefully)
- TMDB has better film coverage than TV series
- Supabase free tier database limits

### Assumptions
- Users have stable internet connection
- Users primarily access via desktop/mobile web browser
- Users value quality over quantity in recommendations
- Guardian reviews align with target user taste
- Users have access to multiple streaming services

---

**Document Version**: 1.0
**Last Updated**: November 19, 2025
**Owner**: Product Team
**Status**: In Development - Phase 1 MVP
