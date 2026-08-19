import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kynppvvvdpuhtigjgaio.supabase.co';
const supabaseAnonKey = 'sb_publishable_FI6UvC07ScDo-MY8-E4DYw_URAL0TnZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
