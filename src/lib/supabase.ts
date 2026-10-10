/**
 * Production Supabase Client Module
 * Hardwired to Oblivion 1 Production Supabase instance.
 */
import {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_AUTH_URL,
  PROD_SUPABASE_URL,
  PROD_SUPABASE_ANON_KEY,
  supabaseAuthOptions,
} from '../services/supabaseClient';

export {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_AUTH_URL,
  PROD_SUPABASE_URL,
  PROD_SUPABASE_ANON_KEY,
  supabaseAuthOptions,
};

export const supabaseClient = supabase;
export default supabase;
