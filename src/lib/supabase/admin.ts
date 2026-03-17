import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Service role client — usar APENAS em API routes server-side
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
