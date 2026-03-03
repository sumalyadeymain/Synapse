import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const reset = url.searchParams.get('reset')

        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll().map(c => ({ name: c.name, size: c.value.length }))

        // 1. Check as Authenticated User (respects RLS)
        const supabase = await createClient()
        const { data: { user }, error: userErr } = await supabase.auth.getUser()

        const admin = createAdminClient()

        // --- ACTION: RESET BALANCE ---
        if (reset === 'true' && user) {
            const { error: resetErr } = await admin
                .from('profiles')
                .update({ wallet_balance: 5000 })
                .eq('id', user.id)

            if (resetErr) return NextResponse.json({ error: resetErr.message }, { status: 500 })
            // Redirect back to avoid multiple resets on refresh
            return NextResponse.redirect(new URL('/api/diag', req.url))
        }

        let authProfile: any = null
        let rlsError: string | null = null

        if (user) {
            const { data, error } = await supabase
                .from('profiles')
                .select('wallet_balance, username, id')
                .eq('id', user.id)
                .single()
            authProfile = data
            rlsError = error?.message || null
        }

        // 2. Check as Admin (bypasses RLS)
        let adminProfile: any = null
        if (user) {
            const { data } = await admin
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            adminProfile = data
        }

        // 3. List some ideas to show owner IDs
        const { data: ideas } = await admin
            .from('ideas')
            .select('id, title, seller_id, price')
            .limit(10)

        // 4. List trades for current user
        let myTrades: any[] = []
        if (user) {
            const { data } = await admin
                .from('trades')
                .select('id, idea_id, status, amount, created_at')
                .eq('buyer_id', user.id)
            myTrades = data || []
        }

        return NextResponse.json({
            status: 'ok',
            hasUser: !!user,
            userId: user?.id,
            userEmail: user?.email,
            userErr: userErr?.message,
            cookiesCount: allCookies.length,
            cookies: allCookies,
            authView: {
                found: !!authProfile,
                profile: authProfile,
                error: rlsError
            },
            adminView: {
                found: !!adminProfile,
                profile: adminProfile ? {
                    id: adminProfile.id,
                    username: adminProfile.username,
                    balance: adminProfile.wallet_balance
                } : null
            },
            myTradesCount: myTrades.length,
            myTrades,
            ideasSample: ideas?.map(i => ({
                id: i.id,
                title: i.title,
                seller_id: i.seller_id,
                is_mine: user ? i.seller_id === user.id : false,
                price: i.price,
                alreadyUnlocked: myTrades.some(t => t.idea_id === i.id)
            })),
            resetBalanceTool: `${url.origin}/api/diag?reset=true`
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
