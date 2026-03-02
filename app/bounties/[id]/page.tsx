"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    CheckCircle2, AlertCircle, Upload, ShieldCheck, FileCheck, ArrowRight,
    Clock, Lock, Sparkles, MessageSquare, Star, XCircle, Brain, Loader2
} from "lucide-react";

type BountyStatus = 'OPEN' | 'PITCHING' | 'ASSIGNED' | 'SUBMITTED' | 'VETTING' | 'RELEASED' | 'DISPUTED';

const STATUS_CONFIG: Record<BountyStatus, { label: string; bg: string; color: string; borderColor: string; dot: string }> = {
    OPEN: { label: 'Open', bg: 'bg-brand-green/10', color: 'text-brand-green', borderColor: 'border-brand-green/30', dot: 'bg-brand-green' },
    PITCHING: { label: 'Pitching', bg: 'bg-brand-blue/10', color: 'text-brand-blue', borderColor: 'border-brand-blue/30', dot: 'bg-brand-blue' },
    ASSIGNED: { label: 'Assigned', bg: 'bg-yellow-500/10', color: 'text-yellow-400', borderColor: 'border-yellow-500/30', dot: 'bg-yellow-400' },
    SUBMITTED: { label: 'Submitted', bg: 'bg-brand-purple/10', color: 'text-brand-purple', borderColor: 'border-brand-purple/30', dot: 'bg-brand-purple' },
    VETTING: { label: 'AI Vetting', bg: 'bg-orange-500/10', color: 'text-orange-400', borderColor: 'border-orange-500/30', dot: 'bg-orange-400' },
    RELEASED: { label: 'Released', bg: 'bg-brand-green/10', color: 'text-brand-green', borderColor: 'border-brand-green/30', dot: 'bg-brand-green' },
    DISPUTED: { label: 'Disputed', bg: 'bg-red-500/10', color: 'text-red-400', borderColor: 'border-red-500/30', dot: 'bg-red-400' },
};

function StatusPill({ status }: { status: BountyStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={`status-badge ${cfg.bg} ${cfg.color} border ${cfg.borderColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'VETTING' ? 'animate-pulse' : ''}`}></span>
            {cfg.label}
        </span>
    );
}

function StepBar({ active }: { active: BountyStatus }) {
    const steps: { key: BountyStatus; label: string }[] = [
        { key: 'OPEN', label: '① Open' },
        { key: 'PITCHING', label: '② Pitching' },
        { key: 'ASSIGNED', label: '③ Assigned' },
        { key: 'SUBMITTED', label: '④ Submitted' },
        { key: 'VETTING', label: '⑤ AI Vetting' },
        { key: 'RELEASED', label: '⑥ Released' },
    ];
    const order = steps.map(s => s.key);
    const activeIdx = order.indexOf(active === 'DISPUTED' ? 'RELEASED' : active);
    return (
        <div className="flex items-center gap-0 text-[10px] font-mono overflow-x-auto pb-1">
            {steps.map((s, i) => (
                <div key={s.key} className="flex items-center shrink-0">
                    <span className={`px-2 py-1 rounded ${i <= activeIdx ? 'text-brand-blue font-bold' : 'text-white/25'}`}>{s.label}</span>
                    {i < steps.length - 1 && <ArrowRight className={`w-3 h-3 shrink-0 ${i < activeIdx ? 'text-brand-blue' : 'text-white/15'}`} />}
                </div>
            ))}
        </div>
    );
}

export default function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [bounty, setBounty] = useState<any>(null);
    const [subs, setSubs] = useState<any[]>([]);
    const [me, setMe] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [pitchText, setPitchText] = useState("");
    const [secretSolution, setSecretSolution] = useState("");

    // Fetch bounty + current user
    useEffect(() => {
        Promise.all([
            fetch(`/api/bounties/${id}`).then(r => r.json()),
            fetch('/api/me').then(r => r.json()),
        ]).then(([bountyData, meData]) => {
            if (bountyData.error) { setError(bountyData.error); }
            else { setBounty(bountyData.bounty); setSubs(bountyData.submissions ?? []); }
            setMe(meData);
            setLoading(false);
        }).catch(() => { setError('Failed to load bounty'); setLoading(false); });
    }, [id]);

    const callAction = async (action: string, extra: object = {}) => {
        setActionLoading(true); setError("");
        const res = await fetch(`/api/bounties/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...extra }),
        });
        const data = await res.json();
        setActionLoading(false);
        if (!res.ok) { setError(data.error || 'Action failed'); return false; }
        // Refresh data
        const refreshed = await fetch(`/api/bounties/${id}`).then(r => r.json());
        if (!refreshed.error) { setBounty(refreshed.bounty); setSubs(refreshed.submissions ?? []); }
        return true;
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32 gap-3 text-white/40">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading bounty…</span>
        </div>
    );

    if (error || !bounty) return (
        <div className="text-center py-32 space-y-4">
            <p className="text-2xl font-bold text-white/30">{error || 'Bounty not found.'}</p>
            <Link href="/bounties"><button className="btn-glass text-sm">← Back to Bounties</button></Link>
        </div>
    );

    const status: BountyStatus = bounty.status;
    const cfg = STATUS_CONFIG[status];
    const isPayer = me?.loggedIn && bounty.payer_id === me.id;
    const myPitch = subs.find(s => s.freelancer_id === me?.id);
    const assignedSub = subs.find(s => s.id === bounty.assigned_submission_id || s.status === 'ASSIGNED' || s.status === 'SUBMITTED' || s.status === 'VETTED_PASS' || s.status === 'VETTED_FAIL');
    const isAssignedToMe = assignedSub?.freelancer_id === me?.id;
    const payer = bounty.payer;

    return (
        <div className="max-w-5xl mx-auto py-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 text-xs text-white/30">
                <Link href="/bounties" className="hover:text-brand-blue transition-colors">Bounties</Link>
                <span>/</span>
                <span className="text-white/70 font-medium truncate">{bounty.title}</span>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </div>
            )}

            {/* ═══ BOUNTY HEADER ═══ */}
            <div className="glass-card relative overflow-hidden border border-white/[0.07]">
                <div className={`absolute inset-0 bg-gradient-to-br ${cfg.bg.replace('bg-', 'from-').replace('/10', '/5')} via-transparent to-transparent`}></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <StatusPill status={status} />
                            {bounty.tags?.map((t: string) => (
                                <span key={t} className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/50">{t}</span>
                            ))}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold leading-snug">{bounty.title}</h1>
                        <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line bg-black/20 p-4 rounded-xl border border-white/[0.06]">{bounty.description}</p>
                        <div className="flex items-center gap-3 text-xs text-white/40">
                            <span className="text-xl">{payer?.avatar_emoji}</span>
                            <span className="font-semibold text-white/70">{payer?.username}</span>
                            <span>·</span>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{bounty.deadline_hours}h deadline</span>
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col justify-between gap-4">
                        <div className="glass rounded-2xl p-5 text-center border border-brand-green/20 min-w-[180px]">
                            <div className="flex items-center justify-center gap-1.5 text-xs text-white/40 mb-1">
                                <Lock className="w-3 h-3" /> Escrow Locked
                            </div>
                            <p className="text-4xl font-mono font-extrabold text-brand-green leading-none">
                                ₹{Number(bounty.reward_amount).toLocaleString('en-IN')}
                            </p>
                            <div className="mt-3 border-t border-white/[0.06] pt-3 space-y-1 text-left">
                                <div className="flex justify-between text-[10px] text-white/40">
                                    <span>Freelancer (85%)</span>
                                    <span className="font-mono text-brand-green">₹{(bounty.reward_amount * 0.85).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-white/40">
                                    <span>Platform fee (15%)</span>
                                    <span className="font-mono">₹{(bounty.reward_amount * 0.15).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* STEP BAR */}
            <div className="glass-card !py-3 !px-5 overflow-x-auto">
                <StepBar active={status} />
            </div>

            <div className="grid md:grid-cols-5 gap-6">
                {/* LEFT MAIN */}
                <div className="md:col-span-3 space-y-6">

                    {/* PITCH FORM — non-payer */}
                    {(status === 'OPEN' || status === 'PITCHING') && !isPayer && (
                        <div className="glass-card border border-brand-blue/20 space-y-4">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-brand-blue" />
                                <h2 className="text-lg font-bold">Submit Your Pitch</h2>
                            </div>
                            {myPitch ? (
                                <div className="flex items-start gap-3 p-4 bg-brand-green/10 border border-brand-green/20 rounded-xl text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-brand-green">Pitch submitted!</p>
                                        <p className="text-white/60 mt-0.5">Waiting for payer to assign.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <textarea
                                        value={pitchText} onChange={e => setPitchText(e.target.value)}
                                        rows={5} placeholder="I can solve this by… My relevant experience includes…"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-brand-blue focus:outline-none transition-colors resize-none"
                                    />
                                    <button
                                        onClick={() => callAction('pitch', { teaser: pitchText })}
                                        disabled={actionLoading || !pitchText.trim()}
                                        className="btn-accent w-full justify-center flex items-center gap-2 text-sm disabled:opacity-50"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {actionLoading ? 'Submitting…' : 'Submit Pitch'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* WAIT MESSAGE — payer when OPEN */}
                    {isPayer && status === 'OPEN' && (
                        <div className="glass-card border border-brand-green/20 p-6 text-center space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-brand-green mx-auto" />
                            <h3 className="font-bold text-brand-green">Bounty is Live!</h3>
                            <p className="text-sm text-white/50">Waiting for freelancers to submit pitches.</p>
                        </div>
                    )}

                    {/* ASSIGNED — freelancer uploads solution */}
                    {status === 'ASSIGNED' && isAssignedToMe && (
                        <div className="glass-card border border-yellow-500/20 space-y-4">
                            <div className="flex items-center gap-2">
                                <Upload className="w-5 h-5 text-yellow-400" />
                                <h2 className="text-lg font-bold">Upload Secret Solution</h2>
                            </div>
                            <textarea
                                value={secretSolution} onChange={e => setSecretSolution(e.target.value)}
                                rows={10} placeholder="// Paste your full solution here…"
                                className="w-full bg-black/60 border border-brand-green/30 rounded-xl p-4 font-mono text-brand-green text-sm focus:border-brand-green focus:outline-none transition-colors resize-none shadow-inner"
                            />
                            <button
                                onClick={() => callAction('submit', { secret_solution: secretSolution })}
                                disabled={actionLoading || !secretSolution.trim()}
                                className="btn-accent w-full justify-center flex items-center gap-2 disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4" />
                                {actionLoading ? 'Uploading & Running AI Vet…' : 'Submit to Secret Vault'}
                            </button>
                        </div>
                    )}

                    {/* ASSIGNED — payer waiting */}
                    {status === 'ASSIGNED' && isPayer && (
                        <div className="glass-card border border-yellow-500/20 p-6 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="font-bold">Waiting for Freelancer</h3>
                                <p className="text-sm text-white/50 mt-0.5">Freelancer is building the solution.</p>
                            </div>
                        </div>
                    )}

                    {/* VETTING */}
                    {status === 'VETTING' && (
                        <div className="glass-card border border-orange-500/30 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-orange-400 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-bold">AI Vetting In Progress</h3>
                                    <p className="text-xs text-white/50">Running plagiarism scan and quality analysis…</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUBMITTED — payer reviews */}
                    {status === 'SUBMITTED' && assignedSub?.status === 'VETTED_PASS' && (
                        <div className="space-y-4">
                            <div className="glass-card border border-white/[0.07] space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileCheck className="w-5 h-5 text-brand-blue" />
                                    <h3 className="font-bold">Secret Solution Vault</h3>
                                    <span className="ml-auto text-[10px] bg-brand-green/20 text-brand-green border border-brand-green/30 px-2 py-0.5 rounded font-bold">AI VETTED ✓</span>
                                </div>
                                <div className="bg-black/70 rounded-xl border border-white/[0.06] p-5 font-mono text-brand-green text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                                    {assignedSub.secret_solution || "(No content)"}
                                </div>
                                {isPayer && (
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => callAction('dispute')} disabled={actionLoading} className="btn-glass flex-1 text-red-400 border-red-500/20">
                                            <AlertCircle className="w-4 h-4 mr-2 inline" /> Reject & Dispute
                                        </button>
                                        <button onClick={() => callAction('release')} disabled={actionLoading} className="btn-accent flex-[2] flex justify-center items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            {actionLoading ? 'Releasing…' : 'Accept & Release Escrow'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RELEASED */}
                    {status === 'RELEASED' && (
                        <div className="glass-card bg-brand-green/5 border border-brand-green/30 text-center py-12 space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-brand-green/20 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-brand-green" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-brand-green">Bounty Completed!</h2>
                            <p className="text-sm text-white/60 max-w-sm mx-auto">
                                <span className="text-brand-green font-bold font-mono">₹{(bounty.reward_amount * 0.85).toFixed(2)}</span> credited to the freelancer's wallet.
                            </p>
                            <div className="flex gap-3 justify-center mt-4">
                                <Link href="/bounties"><button className="btn-glass text-sm">← Back to Bounties</button></Link>
                                {isPayer && <Link href="/bounties/new"><button className="btn-accent text-sm py-2 px-6">Post Another</button></Link>}
                            </div>
                        </div>
                    )}

                    {/* DISPUTED */}
                    {status === 'DISPUTED' && (
                        <div className="glass-card bg-red-500/5 border border-red-500/30 text-center py-12 space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-red-400">Bounty Disputed</h2>
                            <p className="text-sm text-white/60 max-w-sm mx-auto">A Synapse admin is reviewing. Resolution within 48h.</p>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="md:col-span-2 space-y-5">

                    {/* Pitches */}
                    {(status === 'OPEN' || status === 'PITCHING') && (
                        <div>
                            <h3 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">
                                {subs.length} Pitch{subs.length !== 1 ? 'es' : ''} Received
                            </h3>
                            <div className="space-y-3">
                                {subs.map(sub => {
                                    const fl = sub.freelancer;
                                    const isMe = sub.freelancer_id === me?.id;
                                    return (
                                        <div key={sub.id} className={`glass-card !p-0 overflow-hidden border transition-colors ${isMe ? 'border-brand-blue/30' : ''}`}>
                                            <div className="p-5">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <span className="text-2xl mt-0.5">{fl?.avatar_emoji || '👤'}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-bold text-sm">{fl?.username ?? 'Unknown'}</p>
                                                            <span className="text-[10px] font-mono text-brand-purple/80">IQ {fl?.iq_score}</span>
                                                            {isMe && <span className="text-[9px] bg-brand-blue/20 text-brand-blue border border-brand-blue/30 px-1.5 py-0.5 rounded font-bold">You</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Star className="w-3 h-3 text-yellow-500/60" />
                                                        <span className="text-xs text-white/50 font-mono">{fl?.iq_score}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-white/75 leading-relaxed line-clamp-3">{sub.teaser}</p>
                                            </div>
                                            {isPayer && sub.status === 'PITCHED' && (
                                                <div className="border-t border-white/[0.06] px-5 py-3 flex justify-end">
                                                    <button
                                                        onClick={() => callAction('assign', { submission_id: sub.id })}
                                                        disabled={actionLoading}
                                                        className="btn-accent text-xs py-2 px-5"
                                                    >
                                                        {actionLoading ? 'Assigning…' : 'Assign & Lock Escrow →'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {subs.length === 0 && (
                                    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl text-xs text-white/30">
                                        No pitches yet. Be the first!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Escrow Timeline */}
                    <div className="glass-card border border-white/[0.06]">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Escrow Timeline</h3>
                        <div className="space-y-3 text-xs">
                            {[
                                { label: 'Bounty Posted', done: true, time: new Date(bounty.created_at).toLocaleString() },
                                { label: 'Freelancer Assigned', done: !['OPEN', 'PITCHING'].includes(status), time: !['OPEN', 'PITCHING'].includes(status) ? 'Completed' : 'Pending' },
                                { label: 'Solution Uploaded & Vetted', done: ['SUBMITTED', 'RELEASED', 'DISPUTED'].includes(status), time: ['SUBMITTED', 'RELEASED', 'DISPUTED'].includes(status) ? 'Completed' : 'Pending' },
                                { label: 'Escrow Released', done: status === 'RELEASED', time: status === 'RELEASED' ? 'Completed' : 'Pending' },
                            ].map((s, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${s.done ? 'border-brand-green bg-brand-green/20' : 'border-white/20 bg-transparent'}`}>
                                        {s.done && <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>}
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${s.done ? 'text-white' : 'text-white/30'}`}>{s.label}</p>
                                        <p className={`text-[10px] mt-0.5 ${s.done ? 'text-white/40' : 'text-white/20'}`}>{s.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
