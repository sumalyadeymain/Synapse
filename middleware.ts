import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Hardcoded for reliability across Vercel/Edge runtimes
const SUPABASE_URL = 'https://nzrrihtvfkngbphxbeex.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cnJpaHR2ZmtuZ2JwaHhiZWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzY5NjAsImV4cCI6MjA4Nzk1Mjk2MH0.tzLW9x9WfnqedCODOpO9_h6s-tyUCy187lG24rH1zq0'

export async function middleware(request: NextRequest) {
    try {
        let response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        })

        const supabase = createServerClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                        response = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        // Refresh session if expired - required for Server Components
        const { data: { user } } = await supabase.auth.getUser()

        // Protection logic
        const protectedRoutes = ['/wallet', '/dashboard', '/bounties/new', '/idea/new']
        const isProtected = protectedRoutes.some(path => request.nextUrl.pathname.startsWith(path))

        if (isProtected && !user) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            url.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }

        return response
    } catch (e) {
        // Fallback: if middleware fails, allow request but it might fail later in Server Components
        console.error('Middleware Error:', e)
        return NextResponse.next()
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images (svg, png, jpg, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
