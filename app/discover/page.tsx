import { createAdminClient } from "@/lib/supabase/admin";
import IdeaCard from "@/components/IdeaCard";
import { Compass, Search, Filter, ArrowUpDown, Tag, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const POPULAR_CATEGORIES = ["SaaS", "AI", "Mobile", "Web", "Design", "Marketing", "Chrome Ext"];

async function getIdeas(q?: string, category?: string, sort?: string) {
    const admin = createAdminClient();
    let query = admin
        .from('ideas')
        .select(`
            id, seller_id, title, teaser_text, price, category_tags, 
            unlock_count, avg_rating, created_at, 
            profiles:seller_id(username, avatar_emoji, iq_score)
        `)
        .eq('status', 'active');

    if (q) {
        query = query.or(`title.ilike.%${q}%,teaser_text.ilike.%${q}%`);
    }

    if (category && category !== "All") {
        query = query.contains('category_tags', [category]);
    }

    // Sorting
    if (sort === "price_asc") query = query.order('price', { ascending: true });
    else if (sort === "price_desc") query = query.order('price', { ascending: false });
    else if (sort === "popular") query = query.order('unlock_count', { ascending: false });
    else if (sort === "rating") query = query.order('avg_rating', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query.limit(40);
    return data ?? [];
}

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string, category?: string, sort?: string }> }) {
    const params = await searchParams;
    const q = params.q;
    const category = params.category || "All";
    const sort = params.sort || "latest";
    const ideas = await getIdeas(q, category, sort);

    return (
        <div className="py-8 space-y-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue/20 via-brand-purple/10 to-transparent p-8 md:p-12 border border-white/10">
                <div className="relative z-10 max-w-2xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-xs font-bold uppercase tracking-widest">
                        <Sparkles className="w-3 link-primary h-3" /> Marketplace
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight gradient-text">
                        Discover Proven Micro-IP
                    </h1>
                    <p className="text-lg text-white/50 leading-relaxed">
                        Access verified solutions, code chunks, and business models.
                        Locked in escrow, vetted by AI, and ready to deploy.
                    </p>
                </div>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-brand-blue/20 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-brand-purple/20 blur-[80px] rounded-full" />
            </div>

            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-64 shrink-0 space-y-6">
                    {/* Search */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Search Keywords</label>
                        <form method="GET" className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-brand-blue transition-colors" />
                            <input
                                name="q"
                                defaultValue={q}
                                placeholder="Search..."
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-brand-blue/50 focus:bg-white/[0.05] focus:outline-none transition-all"
                            />
                            {category !== "All" && <input type="hidden" name="category" value={category} />}
                            {sort !== "latest" && <input type="hidden" name="sort" value={sort} />}
                        </form>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                            <Tag className="w-3 h-3" /> Categories
                        </div>
                        <div className="flex flex-wrap lg:flex-col gap-2">
                            {["All", ...POPULAR_CATEGORIES].map(cat => (
                                <Link
                                    key={cat}
                                    href={{ query: { ...params, category: cat } }}
                                    className={`px-4 py-2 rounded-xl text-sm transition-all border ${category === cat
                                            ? "bg-brand-blue/10 border-brand-blue text-brand-blue font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                            : "bg-white/[0.02] border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                                        }`}
                                >
                                    {cat}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Sorting */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
                            <ArrowUpDown className="w-3 h-3" /> Sort By
                        </div>
                        <div className="flex flex-wrap lg:flex-col gap-2">
                            {[
                                { id: "latest", label: "Newest First" },
                                { id: "popular", label: "Most Unlocks" },
                                { id: "rating", label: "Highest Rated" },
                                { id: "price_asc", label: "Price: Low to High" },
                                { id: "price_desc", label: "Price: High to Low" },
                            ].map(s => (
                                <Link
                                    key={s.id}
                                    href={{ query: { ...params, sort: s.id } }}
                                    className={`px-4 py-2 rounded-xl text-xs transition-all border ${sort === s.id
                                            ? "bg-white/10 border-white/30 text-white font-bold"
                                            : "bg-white/[0.02] border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                                        }`}
                                >
                                    {s.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Grid Content */}
                <div className="flex-1 space-y-6">
                    {/* Toolbar / Result Count */}
                    <div className="flex items-center justify-between px-2">
                        <p className="text-sm font-medium text-white/40">
                            Showing <span className="text-white">{ideas.length}</span> results
                            {category !== "All" && <span> in <span className="text-brand-blue">{category}</span></span>}
                        </p>
                    </div>

                    {ideas.length === 0 ? (
                        <div className="text-center py-32 glass-card border-dashed border-white/10 space-y-4">
                            <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto">
                                <Search className="w-8 h-8 text-white/10" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white/80">No matches found</h3>
                                <p className="text-white/40 text-sm mt-1">Try adjusting your filters or search terms.</p>
                            </div>
                            <Link href="/discover" className="btn-secondary inline-block !px-6 !py-2 !text-xs mt-2">Clear all filters</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                            {ideas.map((idea: any) => (
                                <IdeaCard key={idea.id} idea={idea} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
