import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzrrihtvfkngbphxbeex.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Admin client — uses service role key, bypasses all RLS.
 * ONLY use in server-side API routes, NEVER in the browser.
 */
export function createAdminClient() {
    return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}
