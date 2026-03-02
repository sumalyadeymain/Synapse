import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const rawUrl = req.headers.get('x-supabase-url') || '';

        // Remove trailing spaces which might corrupt the URL
        const urlToFetch = rawUrl.trim();
        if (!urlToFetch) {
            return NextResponse.json({ error: 'Missing x-supabase-url header' }, { status: 400 });
        }

        // We use the Node.js native fetch here. 
        // Node is configured with NODE_OPTIONS=--dns-result-order=ipv4first
        const response = await fetch(urlToFetch, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apiKey': req.headers.get('x-supabase-key') || '',
                'Authorization': req.headers.get('Authorization') || `Bearer ${req.headers.get('x-supabase-key')}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (err: any) {
        console.error("Proxy error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
