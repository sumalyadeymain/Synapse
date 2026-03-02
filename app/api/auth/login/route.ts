import { NextResponse } from 'next/server';

// ── Hardcoded local user — no Supabase needed ─────────────────
const LOCAL_USER = {
    id: 'local-user-001',
    email: 'sumalyadey1@gmail.com',
    password: '9231629453Ab@',
    username: 'Sumalya',
    avatar_emoji: '🧠',
    role: 'seller',
};

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (email !== LOCAL_USER.email || password !== LOCAL_USER.password) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const response = NextResponse.json({
            success: true,
            user: {
                id: LOCAL_USER.id,
                email: LOCAL_USER.email,
                username: LOCAL_USER.username,
                avatar_emoji: LOCAL_USER.avatar_emoji,
            }
        });

        // Set a simple local session cookie (no Supabase, no network)
        response.cookies.set('local_session', Buffer.from(JSON.stringify({
            id: LOCAL_USER.id,
            email: LOCAL_USER.email,
            username: LOCAL_USER.username,
            avatar_emoji: LOCAL_USER.avatar_emoji,
        })).toString('base64'), {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            sameSite: 'lax',
        });

        return response;
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
