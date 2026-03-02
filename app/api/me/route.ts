import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ balance: 0, loggedIn: false })

        const admin = createAdminClient()
        const { data } = await admin
            .from('profiles')
            .select('wallet_balance, username, avatar_emoji')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            loggedIn: true,
            balance: data?.wallet_balance ?? 0,
            username: data?.username,
            avatar_emoji: data?.avatar_emoji,
        })
    } catch {
        return NextResponse.json({ balance: 0, loggedIn: false })
    }
}
