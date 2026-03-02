"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Star, Eye, Wallet } from "lucide-react";

interface Idea {
    id: string;
    seller_id: string;
    title: string;
    teaser_text: string;
    price: number;
    category_tags: string[];
    unlock_count: number;
    avg_rating: number;
    created_at: string;
    profiles?: { username: string; avatar_emoji: string; iq_score: number } | null;
}

export default function IdeaCard({ idea }: { idea: Idea }) {
    const router = useRouter();
    const [unlocked, setUnlocked] = useState(false);
    const [secretContent, setSecretContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleUnlock = async () => {
        setError(""); setLoading(true);

        // 1. Check local session (no Supabase needed)
        const meRes = await fetch('/api/me');
        const me = await meRes.json();
        if (!me.loggedIn) {
            router.push(`/auth/login?redirect=/discover`);
            setLoading(false);
            return;
        }

        // 2. Call unlock — server handles: owner gets free access, others pay
        const unlockRes = await fetch('/api/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea_id: idea.id }),
        });
        const unlockData = await unlockRes.json();

        // If it's the seller's own idea (is_owner) or already bought (409) → fetch content directly
        const canView = unlockRes.ok || unlockRes.status === 409;
        if (!canView) {
            setError(unlockData.error || 'Failed to unlock');
            setLoading(false);
            return;
        }

        // 3. Fetch the secret content
        const contentRes = await fetch('/api/secret-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ideaId: idea.id }),
        });
        const contentData = await contentRes.json();
        if (!contentRes.ok) {
            setError(contentData.error || 'Could not retrieve secret content');
            setLoading(false);
            return;
        }

        setSecretContent(contentData.secret_content);
        setUnlocked(true);
        setLoading(false);
    };

    const seller = idea.profiles;

    return (
        <div className="glass-card flex flex-col gap-4 relative overflow-hidden border border-white/[0.07] hover:-translate-y-0.5 transition-transform duration-300">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {idea.category_tags?.map(tag => (
                            <span key={tag} className="text-[10px] bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-2 py-0.5 rounded-full font-mono">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h3 className="font-bold text-base leading-snug">{idea.title}</h3>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xl font-mono font-bold text-brand-green">₹{idea.price}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-white/50">{Number(idea.avg_rating).toFixed(1)}</span>
                        <Eye className="w-3 h-3 text-white/30 ml-1" />
                        <span className="text-xs text-white/30">{idea.unlock_count}</span>
                    </div>
                </div>
            </div>

            {/* Teaser */}
            <p className="text-sm text-white/60 leading-relaxed">{idea.teaser_text}</p>

            {/* Seller */}
            {seller && (
                <div className="flex items-center gap-2 text-xs text-white/40 border-t border-white/[0.06] pt-3">
                    <span className="text-lg">{seller.avatar_emoji}</span>
                    <span className="font-semibold text-white/60">{seller.username}</span>
                    <span className="ml-auto font-mono text-brand-purple/70">IQ {seller.iq_score}</span>
                </div>
            )}

            {/* Error / Wallet prompt */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center justify-between gap-2">
                    <span>{error}</span>
                    {error.includes('Insufficient') && (
                        <button
                            onClick={() => router.push('/wallet')}
                            className="flex items-center gap-1 shrink-0 text-brand-green hover:underline"
                        >
                            <Wallet className="w-3.5 h-3.5" /> Top Up
                        </button>
                    )}
                </div>
            )}

            {/* Secret content (revealed after unlock) */}
            {unlocked ? (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-green text-xs font-bold">
                        <Unlock className="w-3.5 h-3.5" /> Secret Unlocked
                    </div>
                    <div className="bg-black/60 border border-brand-green/30 rounded-xl p-4 font-mono text-brand-green text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {secretContent}
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleUnlock}
                    disabled={loading}
                    className="btn-accent w-full flex justify-center items-center gap-2 text-sm mt-1"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Unlocking…
                        </span>
                    ) : (
                        <><Lock className="w-4 h-4" /> Unlock for ₹{idea.price}</>
                    )}
                </button>
            )}
        </div>
    );
}
