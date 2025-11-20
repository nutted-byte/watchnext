# WatchNext - Development Todo List

## ✅ Completed

- [x] Implement design tokens and theme configuration
- [x] Install required dependencies
- [x] Set up project structure and routing
- [x] Create environment variables template
- [x] Create core layout components
- [x] Get TMDB API key
- [x] Get Guardian API key
- [x] Build TMDB API service and search functionality
- [x] Set up Supabase project and database schema
- [x] Set up Google OAuth authentication
- [x] Build authentication UI and hooks
- [x] Implement watchlist management
- [x] Implement watch history with ratings
- [x] Apply Letterboxd-inspired design system (Tailwind v4, colors, typography)
- [x] Update Films page with improved design
- [x] Update Series page with improved design
- [x] Update Home page with enhanced cards and layout
- [x] Enhance TitleCard component with hover effects and shadows
- [x] Integrate Guardian API
- [x] Create GuardianBadge component
- [x] Display Guardian ratings on title cards
- [x] Automatic Guardian enrichment when adding titles
- [x] Build personalized recommendation algorithm
  - [x] Genre matching from watch history (4-5 star titles)
  - [x] Guardian score weighting (25%)
  - [x] Similar titles API for highly-rated content
  - [x] Multi-factor scoring system
  - [x] Filtering of watched/watchlist titles
- [x] **Integrate Claude AI for recommendations** (MAJOR UPDATE)
  - [x] Replace rule-based recommendations with Claude Haiku analysis
  - [x] Implement two-stage approach (pre-filter + AI analysis)
  - [x] Add "Because you watched X" personalized reasoning
  - [x] Optimize API costs by 70% with pre-filtering
  - [x] Quality filtering: 6.5+ TMDB rating, 50+ votes minimum
  - [x] Guardian prioritization: 30 slots with reviews, 10 without
- [x] Dismiss recommendations functionality
  - [x] Store dismissed recommendations in database
  - [x] Exclude dismissed titles from future recommendations
  - [x] Pass dismissed context to Claude for better suggestions
- [x] Recommendation detail modal
  - [x] Click recommendations to see full details
  - [x] Display AI reasoning for each recommendation
  - [x] Show poster, genres, ratings, and overview
- [x] Refresh recommendations button
  - [x] Clear React Query cache
  - [x] Fetch new recommendations on demand
  - [x] Fix JSX syntax errors in button implementation

## 📋 Pending

- [ ] Improve onboarding flow (currently basic)

### Design Polish (Letterboxd-inspired)
- [ ] Update Landing Page design (larger heading, better spacing, enhanced buttons)
- [ ] Update Search Page design (improved spacing, heading sizes, button styling)
- [ ] Update Onboarding Page design (better typography, improved layout)
- [ ] Review and update Header/Navigation styling
- [ ] Add loading skeletons for better perceived performance
- [ ] Polish empty states across all pages

## 🔮 Future Enhancements (Phase 2+)

- [ ] Photo upload and OCR for adding titles
- [ ] Title detail modal/page
- [ ] Advanced filtering and sorting
- [ ] User preferences and settings
- [ ] Performance optimizations
- [ ] Analytics integration
- [ ] Mobile app / PWA

---

**Last Updated**: November 19, 2025
