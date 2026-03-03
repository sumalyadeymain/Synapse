"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Star, Eye, Wallet, Clock, User, ShieldCheck } from "lucide-react";

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

        const meRes = await fetch('/api/me');
        const me = await meRes.json();
        if (!me.loggedIn) {
            router.push(`/auth/login?redirect=/discover`);
            setLoading(false);
            return;
        }

        const unlockRes = await fetch('/api/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea_id: idea.id }),
        });
        const unlockData = await unlockRes.json();

        const canView = unlockRes.ok || unlockRes.status === 409;
        if (!canView) {
            setError(unlockData.error || 'Failed to unlock');
            setLoading(false);
            return;
        }

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

    const [isExpanded, setIsExpanded] = useState(false);
    const seller = idea.profiles;
    const timeAgo = new Date(idea.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const isTeaserLong = idea.teaser_text.length > 120;

    const truncate = (str: string, length: number) => {
        if (!str) return "";
        return str.length > length ? str.slice(0, length) + ".." : str;
    };

    return (
        <div className="glass-card glass-card-hover flex flex-col gap-5 relative overflow-hidden group">
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Upper Section: Tags & Status */}
            <div className="flex items-center justify-between gap-2 relative z-10">
                <div className="flex flex-wrap gap-2">
                    {idea.category_tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] bg-white/[0.05] text-white/60 border border-white/10 px-2.5 py-1 rounded-lg font-bold tracking-tight uppercase whitespace-nowrap">
                            {truncate(tag, 10)}
                        </span>
                    ))}
                    {idea.category_tags?.length > 2 && (
                        <span className="text-[10px] text-white/30 px-1 py-1 font-bold">+{idea.category_tags.length - 2}</span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-blue/10 border border-brand-blue/20 rounded-lg">
                    <ShieldCheck className="w-3 h-3 text-brand-blue" />
                    <span className="text-[10px] font-bold text-brand-blue uppercase tracking-tighter">Verified</span>
                </div>
            </div>

            {/* Title & Price */}
            <div className="space-y-2 relative z-10">
                <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-lg text-white leading-snug group-hover:text-brand-blue transition-colors line-clamp-2">
                        {idea.title}
                    </h3>
                    <div className="text-right shrink-0">
                        <p className="text-2xl font-mono font-extrabold text-brand-green leading-none">₹{idea.price}</p>
                    </div>
                </div>
                <div className="relative">
                    <p className={`text-sm text-white/50 leading-relaxed ${!isExpanded && isTeaserLong ? "line-clamp-3" : ""}`}>
                        {idea.teaser_text}
                    </p>
                    {isTeaserLong && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="text-[10px] font-bold text-brand-blue uppercase mt-1 hover:underline cursor-pointer"
                        >
                            {isExpanded ? "Read less" : "Read more"}
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 text-xs font-medium text-white/30 border-y border-white/[0.05] py-3 relative z-10">
                <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
                    <span className="text-white/70">{Number(idea.avg_rating).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5 text-brand-blue" />
                    <span className="text-white/70">{idea.unlock_count} Unlocks</span>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeAgo}</span>
                </div>
            </div>

            {/* Footer: Seller & CTA */}
            <div className="flex items-center justify-between gap-4 mt-auto relative z-10">
                {seller && (
                    <div className="flex items-center gap-2 group/seller cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-lg">
                            {seller.avatar_emoji}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white/80 group-hover/seller:text-brand-blue transition-colors">{seller.username}</span>
                            <span className="text-[10px] font-mono text-brand-purple tracking-tighter uppercase font-black">IQ {seller.iq_score}</span>
                        </div>
                    </div>
                )}

                {!unlocked && (
                    <button
                        onClick={handleUnlock}
                        disabled={loading}
                        className="btn-accent !px-5 !py-2 text-xs font-bold flex items-center gap-2 group/btn"
                    >
                        {loading ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Lock className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                        )}
                        Unlock
                    </button>
                )}
            </div>

            {/* Unlocked View Overlay */}
            {unlocked && (
                <div className="absolute inset-0 bg-black/95 z-20 flex flex-col p-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-brand-green text-sm font-black uppercase tracking-widest">
                            <Unlock className="w-4 h-4" /> Secret Unlocked
                        </div>
                        <button onClick={() => setUnlocked(false)} className="text-white/30 hover:text-white transition-colors">
                            <Lock className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white/[0.03] border border-white/10 rounded-2xl p-5 font-mono text-xs text-brand-green leading-relaxed whitespace-pre-wrap selection:bg-brand-green/20">
                        {secretContent}
                    </div>
                    <p className="text-[10px] text-white/20 text-center mt-3 uppercase font-bold tracking-widest">Confidential Information — Managed by Synapse Escrow</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="absolute bottom-16 right-6 left-6 z-30 p-3 bg-red-500/90 backdrop-blur-md rounded-xl text-[10px] font-bold text-white flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-300">
                    <span>{error}</span>
                    {error.includes('Insufficient') && (
                        <button onClick={() => router.push('/wallet')} className="underline flex items-center gap-1 shrink-0">
                            <Wallet className="w-3 h-3" /> Top Up
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
