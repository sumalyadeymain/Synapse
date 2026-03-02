import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const PROTECTED = ['/dashboard', '/idea/new', '/wallet', '/bounties/new']
    const isProtected = PROTECTED.some(path => request.nextUrl.pathname.startsWith(path))

    // Refresh session and check the genuine Supabase user object
    const { data: { user } } = await supabase.auth.getUser()

    if (isProtected && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/bounties/new',
        '/idea/new',
        '/wallet',
    ],
}
