import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nzrrihtvfkngbphxbeex.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
    try {
        const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Find the existing user by email
        const { data, error } = await admin.auth.admin.listUsers();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const existingUser = data.users.find(u => u.email === 'sumalyadey1@gmail.com');
        if (existingUser) {
            // Make sure the profile exists
            await admin.from('profiles').upsert({
                id: existingUser.id,
                username: 'Sumalya',
                avatar_emoji: '🧠',
            }, { onConflict: 'id' });

            return NextResponse.json({
                success: true,
                id: existingUser.id,
                message: 'Found existing user — profile ensured'
            });
        }

        // Create new user
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email: 'sumalyadey1@gmail.com',
            password: '9231629453Ab@',
            email_confirm: true,
            user_metadata: { username: 'Sumalya', avatar_emoji: '🧠' },
        });
        if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });

        await admin.from('profiles').upsert({
            id: created.user.id,
            username: 'Sumalya',
            avatar_emoji: '🧠',
        }, { onConflict: 'id' });

        return NextResponse.json({ success: true, id: created.user.id, message: 'New user created' });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

