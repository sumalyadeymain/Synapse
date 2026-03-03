import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll().map(c => ({ name: c.name, size: c.value.length }))

        // 1. Check as Authenticated User (respects RLS)
        const supabase = await createClient()
        const { data: { user }, error: userErr } = await supabase.auth.getUser()

        let authProfile = null
        let rlsError = null

        if (user) {
            const { data, error } = await supabase
                .from('profiles')
                .select('wallet_balance, username, id')
                .eq('id', user.id)
                .single()
            authProfile = data
            rlsError = error?.message
        }

        // 2. Check as Admin (bypasses RLS)
        const admin = createAdminClient()
        let adminProfile = null
        if (user) {
            const { data } = await admin
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            adminProfile = data
        }

        // 3. Search for Sumalya profile by name (Admin)
        const { data: sumalyaByName } = await admin
            .from('profiles')
            .select('*')
            .ilike('username', '%Sumalya%')
            .limit(1)
            .maybeSingle()

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
            sumalyaByName: sumalyaByName ? {
                id: sumalyaByName.id,
                username: sumalyaByName.username,
                balance: sumalyaByName.wallet_balance
            } : null
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
