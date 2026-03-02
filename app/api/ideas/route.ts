import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { vetContent, generateEmbedding } from '@/lib/gemini'

// Read local session cookie
async function getLocalUser() {
    try {
        const cookieStore = await cookies()
        const raw = cookieStore.get('local_session')?.value
        if (!raw) return null
        return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    } catch { return null }
}

// ── GET /api/ideas?q=search_query ───────────────────────────────
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()

    const admin = createAdminClient()

    let query = admin
        .from('ideas')
        .select('id, seller_id, title, teaser_text, price, category_tags, unlock_count, avg_rating, created_at, profiles:seller_id(username, avatar_emoji, iq_score)')
        .eq('status', 'active')
        .order('unlock_count', { ascending: false })
        .limit(30)

    if (q) {
        // Vector similarity search using Gemini embeddings
        const embedding = await generateEmbedding(q)
        const { data, error } = await admin.rpc('match_ideas', {
            query_embedding: embedding,
            match_count: 20,
        })
        if (!error && data) return NextResponse.json({ ideas: data })
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ideas: data })
}

// ── POST /api/ideas ─────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const user = await getLocalUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { title, teaser_text, secret_content, price, category_tags } = body

        if (!title || !teaser_text || !secret_content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
        if (title.length < 10 || teaser_text.length < 50 || secret_content.length < 100) {
            return NextResponse.json({ error: 'Content is too short. Please provide a detailed title, teaser, and solution.' }, { status: 400 })
        }
        if (Number(price) < 50) {
            return NextResponse.json({ error: 'Minimum price is ₹50' }, { status: 400 })
        }

        // 1 & 2. Run AI vetting + embedding generation IN PARALLEL (saves ~5-10s)
        console.log('Starting AI vet + embedding in parallel...')
        const [vet, embedding] = await Promise.all([
            vetContent(title, secret_content),
            generateEmbedding(`${title} ${teaser_text}`)
        ])

        if (!vet.passed) {
            return NextResponse.json({ error: `Content rejected: ${vet.reason}` }, { status: 406 })
        }

        // 3. Insert into Supabase (admin to bypass RLS)
        console.log("3. Inserting into Supabase...");
        const admin = createAdminClient()
        const { data, error } = await admin.from('ideas').insert({
            seller_id: user.id, // 'local-user-001' from local_session cookie
            title,
            teaser_text,
            secret_content,
            price: Number(price),
            category_tags: category_tags || [],
            vector_embedding: embedding,
            ai_vetting_passed: true,
        }).select('id').single()

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        console.log("Success! Idea inserted with ID:", data.id);
        return NextResponse.json({ success: true, idea_id: data.id })
    } catch (err: any) {
        console.error("CATCH BLOCK ERROR in /api/ideas:", err);
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
