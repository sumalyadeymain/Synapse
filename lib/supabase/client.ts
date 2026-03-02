import { createBrowserClient } from '@supabase/ssr'

// Hardcoded so Windows .env.local encoding issues never corrupt these values
const SUPABASE_URL = 'https://nzrrihtvfkngbphxbeex.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cnJpaHR2ZmtuZ2JwaHhiZWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY5NjAsImV4cCI6MjA4Nzk1Mjk2MH0.tzLW9x9WfnqedCODOpO9_h6s-tyUCy187lG24rH1zq0'

export function createClient() {
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
