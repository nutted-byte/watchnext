// Environment variables configuration

export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  tmdb: {
    apiKey: import.meta.env.VITE_TMDB_API_KEY || '',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
  guardian: {
    apiKey: import.meta.env.VITE_GUARDIAN_API_KEY || '',
    baseUrl: 'https://content.guardianapis.com',
  },
  anthropic: {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  },
} as const;

// Validate required environment variables
export function validateEnv() {
  const missing: string[] = [];

  if (!env.supabase.url) missing.push('VITE_SUPABASE_URL');
  if (!env.supabase.anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!env.tmdb.apiKey) missing.push('VITE_TMDB_API_KEY');
  if (!env.guardian.apiKey) missing.push('VITE_GUARDIAN_API_KEY');

  if (missing.length > 0) {
    console.warn(
      'Missing environment variables:',
      missing.join(', '),
      '\nSome features may not work correctly.'
    );
  }

  return missing.length === 0;
}
