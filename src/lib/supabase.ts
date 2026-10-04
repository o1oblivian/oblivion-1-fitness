/**
 * Production Supabase Client Module
 * Hardwired to Oblivion 1 Production Supabase instance.
 */
import { createClient } from '@supabase/supabase-js';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_AUTH_URL, PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY } from '../services/supabaseClient';

export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_AUTH_URL, PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY };

export const supabaseClient = supabase;
export default supabase;
