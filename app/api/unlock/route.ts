import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { idea_id } = await req.json()
        const admin = createAdminClient()

        // Fetch idea price and seller
        const { data: idea, error: ideaErr } = await admin.from('ideas')
            .select('id, price, seller_id')
            .eq('id', idea_id)
            .single()

        if (ideaErr) {
            console.error('Unlock: idea fetch error:', ideaErr.message)
            return NextResponse.json({ error: `DB error: ${ideaErr.message}` }, { status: 500 })
        }
        if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })

        // ── Own idea: seller can always view for free ──────────────
        if (idea.seller_id === user.id) {
            return NextResponse.json({ success: true, is_owner: true })
        }

        // ── Others' idea: check if already bought ─────────────────
        const { data: existing } = await admin.from('trades')
            .select('id').eq('buyer_id', user.id).eq('idea_id', idea_id)
            .in('status', ['PENDING', 'RELEASED']).maybeSingle()
        if (existing) return NextResponse.json({ success: true, already_unlocked: true }, { status: 409 })

        // ── Fetch buyer wallet and deduct ─────────────────────────
        const { data: buyerProfile, error: profileErr } = await admin.from('profiles')
            .select('wallet_balance').eq('id', user.id).single()

        if (profileErr) {
            console.error('Unlock: buyer profile fetch error:', profileErr.message)
            return NextResponse.json({ error: `DB error: ${profileErr.message}` }, { status: 500 })
        }

        const currentBalance = Number(buyerProfile.wallet_balance || 0)
        const price = Number(idea.price)

        if (!buyerProfile || currentBalance < price) {
            return NextResponse.json({
                error: `Insufficient balance. Need ₹${price}, you have ₹${currentBalance}`
            }, { status: 402 })
        }

        const platformFee = +(price * 0.15).toFixed(2)
        const sellerPayout = +(price * 0.85).toFixed(2)
        const releaseAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        // Deduct wallet
        const nextBalance = currentBalance - price
        const { error: deductErr } = await admin.from('profiles')
            .update({ wallet_balance: nextBalance })
            .eq('id', user.id)

        if (deductErr) {
            console.error('Unlock: deduction failed:', deductErr.message)
            return NextResponse.json({ error: `Deduction failed: ${deductErr.message}` }, { status: 500 })
        }

        // Create trade record
        const { data: trade, error: tradeErr } = await admin.from('trades').insert({
            buyer_id: user.id,
            seller_id: idea.seller_id,
            idea_id,
            amount: price,
            platform_fee: platformFee,
            seller_payout: sellerPayout,
            status: 'PENDING',
            release_at: releaseAt,
        }).select('id').single()

        if (tradeErr) {
            console.error('Unlock: trade insert error:', tradeErr.message)
            // Deduction happened — but log it.
        }

        console.log(`Unlock SUCCESS: User ${user.email} unlocked ${idea_id}. Deducted ${price}. Next balance: ${nextBalance}`)

        return NextResponse.json({
            success: true,
            trade_id: trade?.id,
            release_at: releaseAt,
            deducted: price,
            new_balance: nextBalance
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
