import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, username, avatar_emoji } = body;

        if (!email || !password || !username) {
            return NextResponse.json({ error: 'Missing email, password, or username' }, { status: 400 });
        }

        const supabase = await createClient();

        // This runs purely on Node.js using IPv4.
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username, avatar_emoji: avatar_emoji || '🧠' } }
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, user: data.user }, { status: 200 });

    } catch (err: any) {
        console.error("Signup route error:", err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
