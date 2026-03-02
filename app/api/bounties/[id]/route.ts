import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { vetBountySolution } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// ── GET /api/bounties/[id] ────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
    const { id } = await params
    const admin = createAdminClient()

    const { data: bounty, error } = await admin
        .from('bounties')
        .select(`*, payer:payer_id(id, username, avatar_emoji, iq_score)`)
        .eq('id', id)
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    const { data: submissions } = await admin
        .from('bounty_submissions')
        .select(`*, freelancer:freelancer_id(id, username, avatar_emoji, iq_score)`)
        .eq('bounty_id', id)
        .order('created_at', { ascending: true })

    return NextResponse.json({ bounty, submissions: submissions ?? [] })
}

// ── POST /api/bounties/[id] ──────────────────────────────────────
// Body: { action: 'pitch'|'assign'|'submit'|'release'|'dispute', ...payload }
export async function POST(req: Request, { params }: Params) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { action } = body
    const admin = createAdminClient()

    // Fetch current bounty
    const { data: bounty } = await admin.from('bounties').select('*').eq('id', id).single()
    if (!bounty) return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })

    // ── PITCH ─────────────────────────────────────────────────────
    if (action === 'pitch') {
        if (bounty.payer_id === user.id) return NextResponse.json({ error: 'Payer cannot pitch' }, { status: 400 })
        if (!['OPEN', 'PITCHING'].includes(bounty.status)) return NextResponse.json({ error: 'Not accepting pitches' }, { status: 400 })

        const { data: existing } = await admin.from('bounty_submissions')
            .select('id').eq('bounty_id', id).eq('freelancer_id', user.id).maybeSingle()
        if (existing) return NextResponse.json({ error: 'Already pitched' }, { status: 409 })

        const { data: sub, error: subErr } = await admin.from('bounty_submissions').insert({
            bounty_id: id,
            freelancer_id: user.id,
            teaser: body.teaser,
            status: 'PITCHED',
        }).select('id').single()
        if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 })

        await admin.from('bounties').update({ status: 'PITCHING' }).eq('id', id)
        return NextResponse.json({ success: true, submission_id: sub.id })
    }

    // ── ASSIGN ─────────────────────────────────────────────────────
    if (action === 'assign') {
        if (bounty.payer_id !== user.id) return NextResponse.json({ error: 'Only payer can assign' }, { status: 403 })
        const { submission_id } = body

        const [, bountyUpdate] = await Promise.all([
            admin.from('bounty_submissions').update({ status: 'ASSIGNED' }).eq('id', submission_id),
            admin.from('bounties').update({ status: 'ASSIGNED', assigned_submission_id: submission_id }).eq('id', id),
        ])
        if (bountyUpdate.error) return NextResponse.json({ error: bountyUpdate.error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    }

    // ── SUBMIT (secret solution + Gemini vetting) ─────────────────
    if (action === 'submit') {
        if (bounty.status !== 'ASSIGNED') return NextResponse.json({ error: 'Not in ASSIGNED state' }, { status: 400 })

        // Verify submitter is the assigned freelancer
        const { data: assignedSub } = await admin.from('bounty_submissions')
            .select('id, freelancer_id').eq('id', bounty.assigned_submission_id).single()
        if (!assignedSub || assignedSub.freelancer_id !== user.id) {
            return NextResponse.json({ error: 'Not the assigned freelancer' }, { status: 403 })
        }

        // Move to SUBMITTED immediately (show "Vetting" to user)
        await Promise.all([
            admin.from('bounties').update({ status: 'SUBMITTED' }).eq('id', id),
            admin.from('bounty_submissions').update({ secret_solution: body.secret_solution, status: 'SUBMITTED' })
                .eq('id', assignedSub.id),
        ])

            // Trigger Gemini vetting asynchronously (no-await, moves to VETTING state)
            ; (async () => {
                await admin.from('bounties').update({ status: 'VETTING' }).eq('id', id)
                const report = await vetBountySolution(bounty.description, body.secret_solution)

                const verdict_status = report.verdict === 'PASS' ? 'VETTED_PASS' : 'VETTED_FAIL'
                await Promise.all([
                    admin.from('bounty_submissions').update({
                        status: verdict_status,
                        plagiarism_score: report.plagiarism_score,
                        quality_score: report.quality_score,
                        vetting_issues: report.issues,
                        vetting_verdict: report.verdict,
                    }).eq('id', assignedSub.id),
                    admin.from('bounties').update({ status: 'SUBMITTED' }).eq('id', id), // Back to SUBMITTED for payer review
                ])
            })()

        return NextResponse.json({ success: true, message: 'Solution submitted. AI vetting in progress.' })
    }

    // ── RELEASE (payer accepts) ────────────────────────────────────
    if (action === 'release') {
        if (bounty.payer_id !== user.id) return NextResponse.json({ error: 'Only payer can release' }, { status: 403 })

        // Find the assigned freelancer
        const { data: assignedSub } = await admin.from('bounty_submissions')
            .select('freelancer_id').eq('id', bounty.assigned_submission_id).single()
        if (!assignedSub) return NextResponse.json({ error: 'No assigned submission' }, { status: 404 })

        const payout = +(bounty.reward_amount * 0.85).toFixed(2)

        await Promise.all([
            admin.from('profiles').update({ wallet_balance: admin.rpc as any }).eq('id', assignedSub.freelancer_id), // placeholder
            admin.from('bounties').update({ status: 'RELEASED' }).eq('id', id),
            // Credit freelancer wallet
            admin.rpc('increment_wallet', { user_id: assignedSub.freelancer_id, amount: payout }),
        ])

        // Simpler: Direct wallet update
        const { data: fProfile } = await admin.from('profiles')
            .select('wallet_balance, total_earned').eq('id', assignedSub.freelancer_id).single()
        if (fProfile) {
            await admin.from('profiles').update({
                wallet_balance: fProfile.wallet_balance + payout,
                total_earned: fProfile.total_earned + payout,
            }).eq('id', assignedSub.freelancer_id)
        }
        await admin.from('bounties').update({ status: 'RELEASED' }).eq('id', id)

        return NextResponse.json({ success: true, payout_amount: payout })
    }

    // ── DISPUTE ────────────────────────────────────────────────────
    if (action === 'dispute') {
        if (bounty.payer_id !== user.id) return NextResponse.json({ error: 'Only payer can dispute' }, { status: 403 })
        await admin.from('bounties').update({ status: 'DISPUTED' }).eq('id', id)
        return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
