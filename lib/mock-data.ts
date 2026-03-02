/**
 * Synapse Mock Data Store – Advanced Edition
 * Fully simulates all 7 Bounty lifecycle states + full Idea/Trade ecosystem.
 */

// ─── TYPES ─────────────────────────────────────────────────────────────────
export type Profile = {
    id: string;
    username: string;
    iq_score: number;
    wallet_balance: number;
    bio: string;
    avatar_emoji: string;
    role: 'payer' | 'freelancer' | 'both';
};

export type Idea = {
    id: string;
    seller_id: string;
    title: string;
    teaser_text: string;
    secret_content: string;
    price: number;
    category_tags: string[];
    unlock_count: number;
    avg_rating: number;
    status: 'active' | 'inactive';
    created_at: string;
};

export type Trade = {
    id: string;
    buyer_id: string;
    seller_id: string;
    idea_id: string;
    amount: number;
    platform_fee: number;
    seller_payout: number;
    status: 'PENDING' | 'RELEASED' | 'DISPUTED' | 'UNDER_REVIEW';
    created_at: string;
    release_at: string;
};

export type BountyStatus = 'OPEN' | 'PITCHING' | 'ASSIGNED' | 'SUBMITTED' | 'VETTING' | 'RELEASED' | 'DISPUTED';

export type Bounty = {
    id: string;
    payer_id: string;
    title: string;
    description: string;
    tags: string[];
    reward_amount: number;
    status: BountyStatus;
    assigned_submission_id?: string;
    created_at: string;
    deadline_hours: number;
};

export type BountySubmission = {
    id: string;
    bounty_id: string;
    freelancer_id: string;
    teaser: string;
    secret_solution?: string;
    ai_vetting_report?: {
        plagiarism_score: number;
        quality_score: number;
        issues: string[];
        verdict: 'PASS' | 'FAIL';
    };
    status: 'PITCHED' | 'ASSIGNED' | 'SUBMITTED' | 'VETTED_PASS' | 'VETTED_FAIL';
    created_at: string;
};

// ─── CURRENT USER ──────────────────────────────────────────────────────────
export const CURRENT_USER: Profile = {
    id: 'user-123',
    username: 'NeuralHacker',
    iq_score: 142,
    wallet_balance: 1250.00,
    bio: 'Full-stack engineer obsessed with reverse engineering and creative system design.',
    avatar_emoji: '🧠',
    role: 'both',
};

// ─── PROFILES ─────────────────────────────────────────────────────────────
export const mockProfiles: Profile[] = [
    CURRENT_USER,
    {
        id: 'user-456',
        username: 'CodeWizard',
        iq_score: 121,
        wallet_balance: 3500.00,
        bio: 'React architect · UI obsessive · Open source maintainer',
        avatar_emoji: '⚡',
        role: 'freelancer',
    },
    {
        id: 'user-789',
        username: 'SystemThinker',
        iq_score: 135,
        wallet_balance: 6200.00,
        bio: 'CTO of two startups. I pay for ideas that actually work.',
        avatar_emoji: '🏗️',
        role: 'payer',
    },
    {
        id: 'user-999',
        username: 'CryptoAlchemist',
        iq_score: 128,
        wallet_balance: 2100.00,
        bio: 'Security researcher. ETH smart contract auditor.',
        avatar_emoji: '🔐',
        role: 'both',
    },
];

// ─── IDEAS ────────────────────────────────────────────────────────────────
export const mockIdeas: Idea[] = [
    {
        id: 'idea-1',
        seller_id: 'user-456',
        title: 'Bypass JWT Expiry Without Changing Secret Key',
        teaser_text: 'A mathematical trick inside jwt.verify() options that keeps specific tokens valid indefinitely by exploiting the maxAge edge case — without exposing a new secret.',
        secret_content: `// ✅ Full Solution:
// Instead of short-circuiting verify, use the ignoreExpiration option
// paired with your own Redis-based sliding-window session tracker.

const payload = jwt.verify(token, SECRET, { ignoreExpiration: true });

// Then check your own ttl store:
const ttl = await redis.ttl(\`session:\${payload.sub}\`);
if (ttl < 0) throw new Error('Session expired');

// Slide window:
await redis.expire(\`session:\${payload.sub}\`, 60 * 60 * 24);
// Result: JWT "expires" but your server controls actual lifespan.`,
        price: 150.00,
        category_tags: ['Security', 'Node.js', 'Auth'],
        unlock_count: 89,
        avg_rating: 4.8,
        status: 'active',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'idea-2',
        seller_id: 'user-789',
        title: 'The 2-Hour Micro-SaaS Playbook',
        teaser_text: 'A Stripe + Next.js pattern that lets you go from 0 to paying customers in 2 hours. No auth library. No complex backend. One webhook handler.',
        secret_content: `// ✅ Full Playbook:
// 1. Use Stripe Payment Links (zero code needed)
// 2. One Next.js webhook at /api/stripe-hook:
export async function POST(req) {
  const event = stripe.webhooks.constructEvent(
    await req.text(), 
    req.headers['stripe-signature'], 
    process.env.STRIPE_SECRET
  );
  if (event.type === 'checkout.session.completed') {
    const email = event.data.object.customer_email;
    // Send magic link via Resend:
    await resend.emails.send({
      to: email,
      subject: 'Your access link',
      html: \`<a href="\${MAGIC_LINK}">Click to access</a>\`
    });
  }
  return Response.json({ ok: true });
}`,
        price: 85.00,
        category_tags: ['SaaS', 'Stripe', 'Next.js'],
        unlock_count: 34,
        avg_rating: 4.5,
        status: 'active',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'idea-3',
        seller_id: 'user-456',
        title: 'CSS Grid Masonry in 3 Lines — No JS',
        teaser_text: 'Native masonry layout is now partially supported in Chrome Canary via `grid-template-rows: masonry`. Here\'s a cross-browser polyfill using only CSS scroll-driven animations.',
        secret_content: `/* ✅ The Trick — Native CSS Masonry: */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-template-rows: masonry; /* Chrome Canary only */
  align-tracks: stretch;
}

/* Cross-browser fallback using column-count: */
@supports not (grid-template-rows: masonry) {
  .grid {
    display: block;
    column-count: 3;
    column-gap: 1rem;
  }
  .grid > * {
    break-inside: avoid;
    margin-bottom: 1rem;
  }
}`,
        price: 50.00,
        category_tags: ['CSS', 'UI', 'Frontend'],
        unlock_count: 203,
        avg_rating: 4.9,
        status: 'active',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'idea-4',
        seller_id: 'user-999',
        title: 'Ethereum MEV Sandwich Attack — Detection & Prevention',
        teaser_text: 'MEV bots frontrun your swaps. I found a specific nonce-jittering trick that makes your transactions unpredictable enough to slip past sandwich detection heuristics.',
        secret_content: `// ✅ Full Anti-MEV Strategy:
// Use a private mempool relay (Flashbots Protect) + nonce jitter

const tx = await wallet.sendTransaction({
  ...txData,
  gasPrice: ethers.utils.parseUnits(
    (Math.random() * 2 + 20).toFixed(2), // jittered gwei
    'gwei'
  ),
  nonce: await provider.getTransactionCount(wallet.address) + 
    Math.floor(Math.random() * 2) // +0 or +1 jitter
});
// Route via: https://protect.flashbots.net`,
        price: 200.00,
        category_tags: ['Web3', 'Ethereum', 'Security'],
        unlock_count: 41,
        avg_rating: 4.7,
        status: 'active',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

// ─── TRADES ───────────────────────────────────────────────────────────────
export let mockTrades: Trade[] = [
    {
        id: 'trade-1',
        buyer_id: 'user-123',
        seller_id: 'user-456',
        idea_id: 'idea-3',
        amount: 50.00,
        platform_fee: 7.50,
        seller_payout: 42.50,
        status: 'RELEASED',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        release_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'trade-2',
        buyer_id: 'user-123',
        seller_id: 'user-999',
        idea_id: 'idea-4',
        amount: 200.00,
        platform_fee: 30.00,
        seller_payout: 170.00,
        status: 'PENDING',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        release_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    },
];

// ─── BOUNTIES ─────────────────────────────────────────────────────────────
export let mockBounties: Bounty[] = [
    {
        id: 'bounty-1',
        payer_id: 'user-789',
        title: 'Reverse-Engineer Cloudflare Turnstile Bypass (Node.js)',
        description: `I need a production-grade Node.js/TypeScript solution that can programmatically solve or bypass Cloudflare Turnstile challenges to scrape a specific SaaS pricing page.

**Requirements:**
- Pure Node.js (no Puppeteer/headless, no proxy services)
- Must reuse x-csrf tokens and replicate the rotation header pattern
- Must include error-handling for token expiry and re-challenge
- Deliver a clean TypeScript class I can drop into an existing codebase

**Testing criteria:** Must return a valid JSON payload from the protected endpoint at least 95% of the time.`,
        tags: ['Node.js', 'Security', 'Scraping', 'TypeScript'],
        reward_amount: 750.00,
        status: 'PITCHING',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        deadline_hours: 48,
    },
    {
        id: 'bounty-2',
        payer_id: 'user-456',
        title: 'CSS Masonry Dashboard — No JS — Cross-browser',
        description: `A masonry-style analytics dashboard where widgets span varying column widths (1, 2, or full) without JavaScript re-layout. Must work in Chrome 120+, Firefox 115+, and Safari 17.

**Requirements:**
- Pure CSS, zero JavaScript for layout
- Responsive down to 320px
- Draggable (can use HTML draggable attr + minimal CSS transitions)
- Widgets: Stats card, Line chart container, Activity feed, Alert banner`,
        tags: ['CSS', 'Frontend', 'UI/UX'],
        reward_amount: 200.00,
        status: 'ASSIGNED',
        assigned_submission_id: 'sub-2',
        created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        deadline_hours: 72,
    },
    {
        id: 'bounty-3',
        payer_id: 'user-789',
        title: 'Solana Sniper Bot — Token Launch Detection',
        description: `Detect newly created Raydium liquidity pools within 1-2 blocks of creation and execute a buy transaction before most bots.

**Requirements:**
- Use Solana jsonrpc websocket subscriptions (not polling)
- Must parse the Raydium AMM Initialize2 instruction
- Must execute the swap in the SAME block or no later than next
- Deliver as a standalone Rust crate or Node.js service`,
        tags: ['Solana', 'Rust', 'DeFi', 'Trading'],
        reward_amount: 1500.00,
        status: 'SUBMITTED',
        assigned_submission_id: 'sub-4',
        created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        deadline_hours: 120,
    },
    {
        id: 'bounty-4',
        payer_id: 'user-999',
        title: 'Next.js Edge Middleware Auth — Sub-2ms Latency',
        description: `Replace our current NextAuth.js setup (avg ~45ms per request) with a lean Edge middleware using JWT verification only — no database round-trips.

Goals: < 2ms auth check, works on Vercel Edge, fully typed, handles refresh tokens via HttpOnly cookies.`,
        tags: ['Next.js', 'Auth', 'Performance', 'Edge'],
        reward_amount: 350.00,
        status: 'VETTING',
        assigned_submission_id: 'sub-5',
        created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
        deadline_hours: 48,
    },
    {
        id: 'bounty-5',
        payer_id: 'user-789',
        title: 'OpenAI Streaming Response — React Server Component Native',
        description: `Implement a streaming AI response using native React 19 Suspense + Server Actions — no useEffect, no polling, no WebSocket. Must stream token-by-token into the UI in real time.`,
        tags: ['React 19', 'OpenAI', 'Streaming', 'Server Actions'],
        reward_amount: 425.00,
        status: 'RELEASED',
        assigned_submission_id: 'sub-6',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        deadline_hours: 24,
    },
    {
        id: 'bounty-6',
        payer_id: 'user-456',
        title: 'Redis Pub/Sub Real-time Notification System',
        description: `Build a horizontally scalable real-time notification system using Redis Pub/Sub + Server-Sent Events (SSE) — no Socket.io, no Pusher. Must handle 10k concurrent connections on a single Node.js server.`,
        tags: ['Redis', 'Node.js', 'Architecture', 'Performance'],
        reward_amount: 600.00,
        status: 'DISPUTED',
        assigned_submission_id: 'sub-7',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        deadline_hours: 72,
    },
    {
        id: 'bounty-7',
        payer_id: 'user-999',
        title: 'Figma → React Component Converter — AI-Powered',
        description: `Build an automation pipeline that converts Figma frames into production-ready React + Tailwind components via the Figma REST API + GPT-4o Vision. Deliver as an npm package.`,
        tags: ['AI', 'Figma', 'React', 'Developer Tools'],
        reward_amount: 980.00,
        status: 'OPEN',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        deadline_hours: 96,
    },
];

// ─── BOUNTY SUBMISSIONS ───────────────────────────────────────────────────
export let mockBountySubmissions: BountySubmission[] = [
    {
        id: 'sub-1',
        bounty_id: 'bounty-1',
        freelancer_id: 'user-123',
        teaser: 'I\'ve previously reverse-engineered Turnstile challenges for a scraping project. My approach uses the initialization JS payload extracted from the page DOM combined with axios cookie-jar to replay the challenge token without rendering a browser.',
        status: 'PITCHED',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'sub-2',
        bounty_id: 'bounty-2',
        freelancer_id: 'user-123',
        teaser: 'I can implement this using CSS Grid with subgrid + column-span combined with resize observer for adaptive column counts. Zero JS for layout, just a single CSS class. I\'ll also add container queries for the widget internals.',
        secret_solution: `/* ✅ FULL CSS MASONRY DASHBOARD SOLUTION */

:root {
  --cols: 3;
  --gap: 1rem;
}

.dashboard {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: auto;
  gap: var(--gap);
  align-items: start;
}

/* Span utilities */
.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-full   { grid-column: 1 / -1; }

/* Responsive breakpoints */
@media (max-width: 768px) {
  .dashboard { --cols: 1; }
  [class*="col-span"] { grid-column: span 1; }
}
@media (768px < width <= 1024px) {
  .dashboard { --cols: 2; }
  .col-full { grid-column: span 2; }
}`,
        status: 'ASSIGNED',
        created_at: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'sub-3',
        bounty_id: 'bounty-1',
        freelancer_id: 'user-999',
        teaser: 'I\'ve implemented a Cloudflare bypass using their debug endpoint pattern combined with specific Accept-Language and CloudFlare-ray-ID header spoofing. Works for Turnstile v1 and partially v2.',
        status: 'PITCHED',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'sub-4',
        bounty_id: 'bounty-3',
        freelancer_id: 'user-123',
        teaser: 'Built a Raydium sniping bot for my own trading. Uses Geyser gRPC for near-realtime slot updates and decodes the Initialize2 instruction via the Raydium AMM IDL. Achieves sub-200ms from pool detection to swap.',
        secret_solution: `// ✅ FULL SOLANA SNIPER — CORE LOGIC
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

const RAYDIUM_AMM = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');

const conn = new Connection('wss://your-rpc.com', 'confirmed');

conn.onLogs(RAYDIUM_AMM, async ({ logs, signature }) => {
  if (!logs.some(l => l.includes('Initialize2'))) return;
  
  // Fetch transaction to extract new pool keys
  const tx = await conn.getTransaction(signature, { 
    maxSupportedTransactionVersion: 0 
  });
  const poolKeys = decodeInitialize2(tx); // Custom decoder
  
  // Execute swap in next slot
  await executeSwap(poolKeys, BUY_AMOUNT_SOL);
}, 'confirmed');`,
        ai_vetting_report: {
            plagiarism_score: 3,
            quality_score: 92,
            issues: [],
            verdict: 'PASS',
        },
        status: 'SUBMITTED',
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'sub-5',
        bounty_id: 'bounty-4',
        freelancer_id: 'user-456',
        teaser: 'I built an Edge-compatible JWT verifier using the Web Crypto API (no Node deps) that verifies HS256/RS256 in under 0.8ms. It\'s a drop-in Next.js middleware module with refresh token rotation via HttpOnly cookies.',
        secret_solution: `// ✅ FULL EDGE AUTH MIDDLEWARE
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.redirect('/login');

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(process.env.JWT_SECRET!),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    );
    const [header, payload, sig] = token.split('.');
    const valid = await crypto.subtle.verify(
      'HMAC', key,
      base64ToBuffer(sig),
      new TextEncoder().encode(\`\${header}.\${payload}\`)
    );
    if (!valid) throw new Error('Invalid signature');
    return NextResponse.next();
  } catch {
    return NextResponse.redirect('/login');
  }
}`,
        ai_vetting_report: {
            plagiarism_score: 7,
            quality_score: 96,
            issues: [],
            verdict: 'PASS',
        },
        status: 'VETTED_PASS',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'sub-6',
        bounty_id: 'bounty-5',
        freelancer_id: 'user-123',
        teaser: 'Used React 19 Server Actions + the new use() hook to stream OpenAI responses directly from a Server Action into the client without useEffect. The trick is returning an async generator from a server action and consuming it via Suspense + React.use().',
        secret_solution: `// ✅ FULL STREAMING SOLUTION — React 19 Native
'use server';
export async function* streamAI(prompt: string) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  });
  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content ?? '';
  }
}

// Client usage (no useEffect!):
'use client';
export function AIStream({ prompt }: { prompt: string }) {
  const stream = use(streamAI(prompt)); // React 19 use()
  return <Suspense fallback="..."><StreamOutput stream={stream} /></Suspense>;
}`,
        ai_vetting_report: {
            plagiarism_score: 2,
            quality_score: 98,
            issues: [],
            verdict: 'PASS',
        },
        status: 'VETTED_PASS',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'sub-7',
        bounty_id: 'bounty-6',
        freelancer_id: 'user-999',
        teaser: 'Built a Redis Pub/Sub + SSE system at work that handled 15k concurrent SSE connections per node. Used backpressure buffers + client-side EventSource reconnect logic. Claim: I solved it with 8 lines of Redis subscribe config.',
        secret_solution: `// The "solution" was just wrapping ioredis with EventEmitter
// and calling res.write() periodically — not the requested SSE architecture.
// DISPUTED: Payer claims no backpressure handling was delivered.`,
        ai_vetting_report: {
            plagiarism_score: 45,
            quality_score: 38,
            issues: ['Solution does not match brief: no SSE backpressure', 'Partial implementation only', 'High code similarity to public GitHub repo'],
            verdict: 'FAIL',
        },
        status: 'VETTED_PASS', // slipped through AI, human disputed
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────
export function searchMockIdeas(query: string): Idea[] {
    if (!query.trim()) return mockIdeas;
    const q = query.toLowerCase();
    const scored = mockIdeas.map(i => ({
        idea: i,
        score:
            (i.title.toLowerCase().includes(q) ? 3 : 0) +
            (i.teaser_text.toLowerCase().includes(q) ? 2 : 0) +
            (i.category_tags.some(t => t.toLowerCase().includes(q)) ? 1 : 0),
    }));
    return scored.sort((a, b) => b.score - a.score).map(s => s.idea);
}

export const STATUS_CONFIG: Record<BountyStatus, {
    label: string; color: string; bg: string; borderColor: string; dot: string;
}> = {
    OPEN: { label: 'Open', color: 'text-emerald-400', bg: 'bg-emerald-400/10', borderColor: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    PITCHING: { label: 'Pitching', color: 'text-sky-400', bg: 'bg-sky-400/10', borderColor: 'border-sky-500/30', dot: 'bg-sky-400' },
    ASSIGNED: { label: 'Assigned', color: 'text-yellow-400', bg: 'bg-yellow-400/10', borderColor: 'border-yellow-500/30', dot: 'bg-yellow-400' },
    SUBMITTED: { label: 'Submitted', color: 'text-purple-400', bg: 'bg-purple-400/10', borderColor: 'border-purple-500/30', dot: 'bg-purple-400' },
    VETTING: { label: 'AI Vetting', color: 'text-orange-400', bg: 'bg-orange-400/10', borderColor: 'border-orange-500/30', dot: 'bg-orange-400' },
    RELEASED: { label: 'Released', color: 'text-brand-green', bg: 'bg-green-400/10', borderColor: 'border-green-500/30', dot: 'bg-green-400' },
    DISPUTED: { label: 'Disputed', color: 'text-red-400', bg: 'bg-red-400/10', borderColor: 'border-red-500/30', dot: 'bg-red-400' },
};
