import { createClient } from '@supabase/supabase-js';

// Helper to get env var
const getEnv = (key: string, fallback: string) => {
  // @ts-ignore - import.meta.env is available in Vite
  return import.meta.env?.[key] || fallback;
};

// Supabase Configuration
// We prioritise environment variables (VITE_...) but fall back to the hardcoded demo credentials.
// This ensures the app connects immediately without requiring a .env file for the demo.
const supabaseUrl = getEnv("VITE_SUPABASE_URL", "https://ycyzviutyhxclxgzftaa.supabase.co");
const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeXp2aXV0eWh4Y2x4Z3pmdGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MDE3NjcsImV4cCI6MjA4MDM3Nzc2N30.bvyMi5wKmF_f22QiNlUBEB0x-AHR9UAMsH-K1pesROA");

// Only initialize if keys are present
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = !!supabase;
