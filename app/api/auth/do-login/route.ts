import { NextResponse } from 'next/server';

// ── Hardcoded local credentials — no Supabase ────────────────
const LOCAL_EMAIL = 'sumalyadey1@gmail.com';
const LOCAL_PASSWORD = '9231629453Ab@';
const LOCAL_USER = {
    id: 'cd559613-6eb6-46cc-bca0-afbd48a6bdf7', // real Supabase UUID for sumalyadey1@gmail.com
    email: LOCAL_EMAIL,
    username: 'Sumalya',
    avatar_emoji: '🧠',
};

export async function POST(req: Request) {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const email = params.get('email') ?? '';
    const password = params.get('password') ?? '';
    const redirect = params.get('redirect') ?? '/discover';

    if (email !== LOCAL_EMAIL || password !== LOCAL_PASSWORD) {
        // Redirect back to login with error flag
        return NextResponse.redirect(
            new URL(`/auth/login?error=bad_credentials&redirect=${encodeURIComponent(redirect)}`, req.url),
            303
        );
    }

    const session = Buffer.from(JSON.stringify(LOCAL_USER)).toString('base64');
    const response = NextResponse.redirect(new URL(redirect, req.url), 303);
    response.cookies.set('local_session', session, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
    });
    return response;
}
