import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll().map(c => ({ name: c.name, size: c.value.length }))

        const supabase = await createClient()
        const { data: { user }, error: userErr } = await supabase.auth.getUser()

        const admin = createAdminClient()

        // Search for Sumalya profile
        const { data: sumalyaProfile } = await admin
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
            sumalyaProfileFound: !!sumalyaProfile,
            sumalyaProfile: sumalyaProfile ? {
                id: sumalyaProfile.id,
                username: sumalyaProfile.username,
                balance: sumalyaProfile.wallet_balance
            } : null
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
