import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, Clock, CheckCircle, TrendingUp, Plus, Package } from "lucide-react";

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";

export default async function SellerDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login?redirect=/dashboard/seller");

    const admin = createAdminClient();

    const [profileRes, ideasRes, tradesRes] = await Promise.all([
        admin.from("profiles").select("username, wallet_balance, total_earned, iq_score, avatar_emoji").eq("id", user.id).single(),
        admin.from("ideas").select("id, title, price, unlock_count, avg_rating, status").eq("seller_id", user.id).order("created_at", { ascending: false }),
        admin.from("trades").select("id, amount, seller_payout, status, created_at").eq("seller_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    const profile = profileRes.data;
    const ideas = ideasRes.data ?? [];
    const trades = tradesRes.data ?? [];

    const escrowPending = trades.filter(t => t.status === "PENDING").reduce((sum, t) => sum + Number(t.seller_payout), 0);
    const totalReleased = trades.filter(t => t.status === "RELEASED").reduce((sum, t) => sum + Number(t.seller_payout), 0);

    return (
        <div className="space-y-8 py-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold mb-1">Seller Dashboard</h1>
                    <p className="text-white/50 text-sm">Your earnings, active ideas, and escrow status.</p>
                </div>
                <Link href="/idea/new">
                    <button className="btn-accent flex items-center gap-2 text-sm">
                        <Plus className="w-4 h-4" /> Post Idea
                    </button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Lifetime Earned", value: `₹${Number(profile?.total_earned ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: <TrendingUp className="w-4 h-4" />, color: "text-brand-green" },
                    { label: "In Escrow", value: `₹${escrowPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: <Clock className="w-4 h-4" />, color: "text-brand-blue" },
                    { label: "Wallet Balance", value: `₹${Number(profile?.wallet_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: <Wallet className="w-4 h-4" />, color: "text-purple-400" },
                    { label: "Ideas Published", value: ideas.length, icon: <Package className="w-4 h-4" />, color: "text-white/70" },
                ].map(s => (
                    <div key={s.label} className="glass-card !py-4">
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${s.color} mb-2`}>{s.icon} {s.label}</div>
                        <p className="text-2xl font-mono font-bold">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Ideas */}
            <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-white/40" /> Your Ideas</h2>
                {ideas.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl text-white/30">
                        <Package className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p>No ideas posted yet. <Link href="/idea/new" className="text-brand-blue hover:underline">Post your first →</Link></p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ideas.map((idea: any) => (
                            <div key={idea.id} className="glass-card !py-3 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{idea.title}</p>
                                    <p className="text-xs text-white/40 mt-0.5">{idea.unlock_count} unlocks · ⭐ {Number(idea.avg_rating).toFixed(1)}</p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${idea.status === 'active' ? 'bg-brand-green/20 text-brand-green' : 'bg-white/10 text-white/40'}`}>
                                        {idea.status}
                                    </div>
                                    <p className="text-lg font-mono font-bold text-brand-green">₹{idea.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent transactions */}
            {trades.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-white/40" /> Recent Sales</h2>
                    <div className="space-y-2">
                        {trades.map((t: any) => (
                            <div key={t.id} className="flex items-center justify-between glass-card !py-3 text-sm">
                                <div>
                                    <p className="font-medium">{new Date(t.created_at).toLocaleDateString()}</p>
                                    <p className={`text-xs mt-0.5 ${t.status === 'RELEASED' ? 'text-brand-green' : t.status === 'DISPUTED' ? 'text-red-400' : 'text-yellow-400'}`}>{t.status}</p>
                                </div>
                                <p className="font-mono font-bold text-brand-green">+₹{Number(t.seller_payout).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
