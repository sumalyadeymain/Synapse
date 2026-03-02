import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('Missing Stripe environment variables')
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as any })

    const body = await req.text()
    const sig = req.headers.get('stripe-signature')!

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: any) {
        console.error('Webhook signature error:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const creditAmount = Number(session.metadata?.credit_amount)

        if (!userId || isNaN(creditAmount)) {
            return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        const admin = createAdminClient()
        const { data: profile } = await admin
            .from('profiles')
            .select('wallet_balance')
            .eq('id', userId)
            .single()

        if (profile) {
            await admin.from('profiles')
                .update({ wallet_balance: profile.wallet_balance + creditAmount })
                .eq('id', userId)
        }
    }

    return NextResponse.json({ received: true })
}
