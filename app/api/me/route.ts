import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    try {
        const store = await cookies()
        const raw = store.get('local_session')?.value
        if (!raw) return NextResponse.json({ balance: 0, loggedIn: false })

        const user = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))

        const admin = createAdminClient()
        const { data } = await admin
            .from('profiles')
            .select('wallet_balance')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            loggedIn: true,
            balance: data?.wallet_balance ?? 0,
            username: user.username,
            avatar_emoji: user.avatar_emoji,
        })
    } catch {
        return NextResponse.json({ balance: 0, loggedIn: false })
    }
}
