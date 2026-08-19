import type { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = Symbol('SUPABASE_CLIENT');

export type { SupabaseClient };
