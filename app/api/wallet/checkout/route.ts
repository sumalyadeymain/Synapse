import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /api/wallet/checkout
// Body: { amount: number }  (amount in INR)
export async function POST(req: Request) {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('Missing Stripe environment variables')
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as any })

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { amount } = await req.json()
        const validAmounts = [100, 500, 1000, 2500, 5000]
        if (!validAmounts.includes(Number(amount))) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: `Synapse Wallet — ₹${amount} Credits`,
                        description: 'Used to unlock ideas and post bounties on Synapse',
                    },
                    unit_amount: amount * 100, // paise
                },
                quantity: 1,
            }],
            metadata: {
                user_id: user.id,
                credit_amount: amount.toString(),
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?success=true&amount=${amount}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?cancelled=true`,
        })

        return NextResponse.json({ url: session.url })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
