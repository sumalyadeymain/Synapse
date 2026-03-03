import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import IdeaCard from "@/components/IdeaCard";
import Link from "next/link";
import { AlertCircle, Clock, ShoppingBag } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function BuyerDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login?redirect=/dashboard/buyer");

    const admin = createAdminClient();

    // Fetch all trades + joined idea info
    const { data: trades } = await admin
        .from("trades")
        .select(`
      id, amount, status, release_at, created_at,
      ideas:idea_id(id, seller_id, title, teaser_text, price, category_tags, unlock_count, avg_rating, created_at, profiles:seller_id(username, avatar_emoji, iq_score))
    `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

    const purchases = trades ?? [];

    return (
        <div className="space-y-8 py-6">
            <div>
                <h1 className="text-3xl font-extrabold mb-1">My Unlocked Secrets</h1>
                <p className="text-white/50 text-sm">Ideas you've purchased. Content is revealed below each card.</p>
            </div>

            {purchases.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl text-white/30 space-y-3">
                    <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
                    <p>You haven't unlocked any ideas yet.</p>
                    <Link href="/discover">
                        <button className="btn-accent text-sm py-2 px-6 mt-2">Browse Discover →</button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {purchases.map((trade: any) => {
                        const idea = trade.ideas;
                        if (!idea) return null;
                        return (
                            <div key={trade.id} className="relative">
                                {trade.status === "PENDING" && (
                                    <div className="absolute -top-3 -right-3 z-20 bg-brand-blue text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                                        <Clock className="w-3 h-3" /> 24h Escrow
                                    </div>
                                )}
                                <IdeaCard idea={idea} />
                                {trade.status === "PENDING" && (
                                    <div className="mt-3 bg-white/5 border border-red-500/20 rounded-xl p-3 flex justify-between items-center hover:bg-red-500/10 transition-colors">
                                        <div className="flex items-center gap-2 text-xs text-white/60">
                                            <AlertCircle className="w-4 h-4 text-red-400" /> Issue with this?
                                        </div>
                                        <button className="text-xs font-semibold text-red-400 border border-red-400/30 px-3 py-1.5 rounded-md hover:bg-red-500/20 transition-colors">
                                            File Dispute
                                        </button>
                                    </div>
                                )}
                                {trade.status === "DISPUTED" && (
                                    <div className="mt-3 bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 text-center">
                                        Dispute under review by admin.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
