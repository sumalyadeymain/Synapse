import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    const PROTECTED = ['/dashboard', '/idea/new', '/wallet', '/bounties/new']
    const isProtected = PROTECTED.some(path => pathname.startsWith(path))

    if (!isProtected) return NextResponse.next()

    // Check for our local session cookie — set by /api/auth/login, no Supabase needed
    const session = request.cookies.get('local_session')
    if (!session) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/bounties/new',
        '/idea/new',
        '/wallet',
    ],
}
