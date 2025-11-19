import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Create a single supabase client for interacting with your database
export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types (will be auto-generated from Supabase later)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          google_id: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          google_id: string;
          display_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          google_id?: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other table types as we build them
    };
  };
};
