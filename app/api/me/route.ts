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
