import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { env, hasSupabaseConfig } from './env';

export function getSupabaseClient() {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
