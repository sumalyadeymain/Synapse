import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { vetBountyQuestion } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/bounties?status=OPEN ────────────────────────────────
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const admin = createAdminClient()
    let query = admin
        .from('bounties')
        .select(`
      *,
      payer:payer_id(username, avatar_emoji, iq_score),
      bounty_submissions(count)
    `)
        .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ bounties: data })
}

// ── POST /api/bounties ────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { title, description, tags, reward_amount, deadline_hours } = body

        if (!title || !description) {
            return NextResponse.json({ error: 'title and description required' }, { status: 400 })
        }
        if (Number(reward_amount) < 50) {
            return NextResponse.json({ error: 'Minimum reward is ₹50' }, { status: 400 })
        }

        // 1. Gemini validation — check if it's a real, solvable problem
        const validation = await vetBountyQuestion(title, description)
        if (!validation.valid) {
            return NextResponse.json({
                error: `Bounty rejected by AI: ${validation.reason}`
            }, { status: 400 })
        }

        const admin = createAdminClient()

        // 2. Check payer's wallet
        const { data: profile, error: profileErr } = await admin.from('profiles')
            .select('wallet_balance').eq('id', user.id).single()

        if (profileErr) {
            console.error('Bounty: profile fetch error:', profileErr.message)
            return NextResponse.json({ error: `DB error: ${profileErr.message}` }, { status: 500 })
        }
        if (!profile || profile.wallet_balance < Number(reward_amount)) {
            return NextResponse.json({ error: 'Insufficient wallet balance to lock escrow' }, { status: 402 })
        }

        // 3. Create bounty first, then deduct wallet
        const { data: bounty, error: bountyErr } = await admin.from('bounties').insert({
            payer_id: user.id,
            title,
            description,
            tags: tags || [],
            reward_amount: Number(reward_amount),
            deadline_hours: Number(deadline_hours) || 48,
            status: 'OPEN',
        }).select('id').single()

        if (bountyErr) {
            return NextResponse.json({ error: bountyErr.message }, { status: 500 })
        }

        // 4. Deduct wallet after bounty created
        const { error: deductErr } = await admin.from('profiles')
            .update({ wallet_balance: Number(profile.wallet_balance) - Number(reward_amount) })
            .eq('id', user.id)

        if (deductErr) {
            console.error('Wallet deduction failed:', deductErr.message)
            // Bounty already created, log but don't block
        }

        return NextResponse.json({ success: true, bounty_id: bounty.id })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
