import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/settle-escrow
// Called by: cron job or manually. Protected by CRON_SECRET.
export async function POST(req: Request) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Call the pg function we defined in schema.sql
    const { error } = await admin.rpc('process_expired_escrows')

    if (error) {
        console.error('Escrow settlement error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Escrow settlement triggered' })
}
