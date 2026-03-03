import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nzrrihtvfkngbphxbeex.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cnJpaHR2ZmtuZ2JwaHhiZWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM3Njk2MCwiZXhwIjoyMDg3OTUyOTYwfQ.L6CxuXGiiO2pio_MTYPugreLaY_gX0fNNWuHJFYCUzI'

/**
 * Admin client — uses service role key, bypasses all RLS.
 * ONLY use in server-side API routes, NEVER in the browser.
 */
export function createAdminClient() {
    return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}
