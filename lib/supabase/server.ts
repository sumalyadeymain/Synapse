import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Hardcoded so Windows .env.local encoding issues never corrupt these values
const SUPABASE_URL = 'https://nzrrihtvfkngbphxbeex.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cnJpaHR2ZmtuZ2JwaHhiZWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY5NjAsImV4cCI6MjA4Nzk1Mjk2MH0.tzLW9x9WfnqedCODOpO9_h6s-tyUCy187lG24rH1zq0'

export async function createClient() {
    const cookieStore = await cookies()
    return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch { /* ignore in Server Components */ }
            },
        },
    }
    )
}
