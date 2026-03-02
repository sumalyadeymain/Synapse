import { NextResponse } from 'next/server';
import { mockIdeas, CURRENT_USER, Idea } from '@/lib/mock-data';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, teaser_text, secret_content, price, category_tags } = body;

        if (!title || !teaser_text || !secret_content || price < 50) {
            return NextResponse.json({ error: 'Invalid idea data' }, { status: 400 });
        }

        // 1. AI Vetting (Mocked)
        // Production: Call OpenAI Moderation API & GPT-4o-mini to ensure it's not gibberish.
        const isGibberish = title.length < 5 || secret_content.length < 10;
        if (isGibberish) {
            return NextResponse.json({ error: 'Idea rejected by AI quality filter.' }, { status: 406 });
        }

        // 2. Generate Embeddings (Mocked)
        // Production: Call text-embedding-3-small on (title + teaser)
        const mockVector = new Array(1536).fill(0.01);

        // 3. Insert into database
        const newIdea: Idea = {
            id: `idea-${Math.floor(Math.random() * 10000)}`,
            seller_id: CURRENT_USER.id,
            title,
            teaser_text,
            secret_content,
            price: Number(price),
            category_tags: category_tags || [],
            unlock_count: 0,
            avg_rating: 0,
            status: 'active',
            created_at: new Date().toISOString(),
        };

        // Note: Since we use an in-memory mock, push it to our array
        mockIdeas.push(newIdea);

        return NextResponse.json({ success: true, idea: newIdea });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
