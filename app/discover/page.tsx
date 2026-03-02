import { createAdminClient } from "@/lib/supabase/admin";
import IdeaCard from "@/components/IdeaCard";
import { Compass, Search } from "lucide-react";

export const dynamic = "force-dynamic";

async function getIdeas(q?: string) {
    const admin = createAdminClient();
    const { data } = await admin
        .from('ideas')
        .select('id, seller_id, title, teaser_text, price, category_tags, unlock_count, avg_rating, created_at, profiles:seller_id(username, avatar_emoji, iq_score)')
        .eq('status', 'active')
        .order('unlock_count', { ascending: false })
        .limit(30);
    return data ?? [];
}

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const { q } = await searchParams;
    const ideas = await getIdeas(q);

    return (
        <div className="py-6 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-extrabold flex items-center gap-3">
                    <Compass className="w-9 h-9 text-brand-blue" /> Discover Ideas
                </h1>
                <p className="text-white/50 text-sm">Unlock verified micro-IP — hacks, shortcuts, and solutions locked behind escrow.</p>
            </div>

            {/* Search */}
            <form method="GET" className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search ideas by topic, language, problem…"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:border-brand-blue focus:outline-none transition-colors"
                />
            </form>

            {/* Grid */}
            {ideas.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl text-white/30 space-y-2">
                    <Compass className="w-10 h-10 mx-auto opacity-30" />
                    <p>No ideas yet. Be the first to post one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {ideas.map((idea: any) => (
                        <IdeaCard key={idea.id} idea={idea} />
                    ))}
                </div>
            )}
        </div>
    );
}
