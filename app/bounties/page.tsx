import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { STATUS_CONFIG, type BountyStatus } from "@/lib/mock-data";
import { Target, CopyPlus, Clock, DollarSign, TrendingUp, ListFilter, ArrowUpRight } from "lucide-react";

async function getBounties() {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from('bounties')
        .select('*, payer:payer_id(username, avatar_emoji, iq_score)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export default async function BountiesBoard() {
    let bounties: any[] = [];
    try { bounties = await getBounties(); } catch { /* use empty list */ }

    const open = bounties.filter(b => ['OPEN', 'PITCHING'].includes(b.status)).length;
    const totalV = bounties.reduce((a, b) => a + Number(b.reward_amount), 0);
    const released = bounties.filter(b => b.status === 'RELEASED').length;

    return (
        <div className="py-6 space-y-8">
            {/* Hero */}
            <div className="relative rounded-3xl overflow-hidden border border-brand-blue/20 p-8 md:p-10">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 via-transparent to-brand-green/5 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-blue">
                            <Target className="w-4 h-4" /> High-Stakes Bounties Board
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                            Solve Problems.<br />
                            <span className="text-gradient">Claim Escrow.</span>
                        </h1>
                        <p className="text-white/60 text-sm max-w-xl leading-relaxed">
                            Payers lock funds into automated 24h escrow. Submit a pitch, get assigned, upload the secret — Gemini AI vets it and funds release instantly on acceptance.
                        </p>
                    </div>
                    <Link href="/bounties/new" className="shrink-0">
                        <button className="btn-accent py-4 px-8 text-lg flex items-center gap-2">
                            <CopyPlus className="w-5 h-5" /> Post a Bounty
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Bounties', value: bounties.length, icon: <Target className="w-4 h-4" />, color: 'text-brand-blue' },
                    { label: 'Accepting Pitches', value: open, icon: <TrendingUp className="w-4 h-4" />, color: 'text-brand-green' },
                    { label: 'Total Value Locked', value: `₹${totalV.toLocaleString('en-IN')}`, icon: <DollarSign className="w-4 h-4" />, color: 'text-purple-400' },
                    { label: 'Completed', value: released, icon: <Clock className="w-4 h-4" />, color: 'text-white/60' },
                ].map(s => (
                    <div key={s.label} className="glass-card !py-4 space-y-1">
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${s.color} mb-2`}>{s.icon}{s.label}</div>
                        <p className="text-2xl font-mono font-bold">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ListFilter className="w-5 h-5 text-white/40" /> All Bounties
                    </h2>
                    <span className="text-xs text-white/40 font-mono">{bounties.length} bounties</span>
                </div>

                {bounties.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl text-white/30">
                        <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        No bounties yet. Be the first to post a problem!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {bounties.map(b => {
                            const cfg = STATUS_CONFIG[b.status as BountyStatus];
                            const age = Math.round((Date.now() - new Date(b.created_at).getTime()) / 3600000);
                            return (
                                <Link key={b.id} href={`/bounties/${b.id}`}>
                                    <div className="glass-card group cursor-pointer flex flex-col gap-4 relative overflow-hidden hover:-translate-y-0.5 transition-transform border border-white/[0.07]">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${cfg.dot}`}></div>
                                        <div className="flex items-start justify-between gap-3 pl-2">
                                            <div className="flex-1 space-y-1.5">
                                                <span className={`status-badge ${cfg.bg} ${cfg.color} border ${cfg.borderColor} text-[9px] w-fit`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${b.status === 'VETTING' ? 'animate-pulse' : ''}`}></span>
                                                    {cfg.label}
                                                </span>
                                                <h3 className="font-bold text-base leading-snug group-hover:text-brand-blue transition-colors line-clamp-2">{b.title}</h3>
                                            </div>
                                            <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-brand-blue transition-colors shrink-0 mt-1" />
                                        </div>
                                        {b.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pl-2">
                                                {b.tags.map((t: string) => (
                                                    <span key={t} className="text-[10px] bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-full font-mono text-white/60">{t}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 pl-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{b.payer?.avatar_emoji ?? '👤'}</span>
                                                <div>
                                                    <p className="text-xs font-semibold text-white/80">{b.payer?.username ?? 'Unknown'}</p>
                                                    <p className="text-[10px] text-white/40">{age < 1 ? 'Just now' : `${age}h ago`}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-white/40 mb-0.5">Reward</p>
                                                <p className="text-xl font-mono font-bold text-brand-green">₹{Number(b.reward_amount).toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
