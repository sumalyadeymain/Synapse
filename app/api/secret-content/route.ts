import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/secret-content
// Body: { idea_id: string }
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { ideaId } = await req.json()
        if (!ideaId) return NextResponse.json({ error: 'ideaId required' }, { status: 400 })

        const admin = createAdminClient()

        // Check if user is the seller (always has access)
        const { data: idea } = await admin
            .from('ideas')
            .select('seller_id, secret_content')
            .eq('id', ideaId)
            .single()

        if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
        if (idea.seller_id === user.id) {
            return NextResponse.json({ secret_content: idea.secret_content })
        }

        // Check if buyer has an active/released trade
        const { data: trade } = await admin
            .from('trades')
            .select('id, status')
            .eq('buyer_id', user.id)
            .eq('idea_id', ideaId)
            .in('status', ['PENDING', 'RELEASED'])
            .limit(1)
            .maybeSingle()

        if (!trade) {
            return NextResponse.json({ error: 'No active trade for this idea' }, { status: 403 })
        }

        return NextResponse.json({ secret_content: idea.secret_content })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
