"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, Receipt, Loader2 } from "lucide-react";

export default function NewBountyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ title: "", description: "", reward_amount: "100", tags: "", deadline_hours: "48" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setLoading(true);

        const res = await fetch('/api/bounties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: form.title,
                description: form.description,
                reward_amount: Number(form.reward_amount),
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                deadline_hours: Number(form.deadline_hours),
            }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
        router.push(`/bounties/${data.bounty_id}`);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-extrabold">Post a Bounty</h1>
                <p className="text-white/50">Lock funds into Escrow to guarantee payment.</p>
            </div>

            <div className="glass-card !p-8 space-y-6">
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Problem Title</label>
                        <input name="title" required value={form.title} onChange={handleChange}
                            placeholder="e.g. Cloudflare Turnstile Bypass in Node.js"
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-blue focus:outline-none transition-colors" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Detailed Requirements</label>
                        <textarea name="description" required value={form.description} onChange={handleChange}
                            rows={7} placeholder="Describe the problem, acceptance criteria, tech stack..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-blue focus:outline-none transition-colors resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Tags (comma-separated)</label>
                            <input name="tags" value={form.tags} onChange={handleChange}
                                placeholder="Node.js, TypeScript, Security"
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-blue focus:outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Deadline (hours)</label>
                            <input name="deadline_hours" type="number" min="24" max="720" value={form.deadline_hours} onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-brand-blue focus:outline-none transition-colors" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Reward Amount (₹)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-xl font-bold text-brand-green">₹</span>
                            <input type="number" name="reward_amount" required min="50" value={form.reward_amount} onChange={handleChange}
                                className="w-full bg-black/40 border border-brand-green/30 rounded-xl py-3.5 pl-10 pr-4 text-2xl font-bold font-mono text-white focus:border-brand-green focus:outline-none transition-colors" />
                        </div>
                        <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Full amount is deducted from your wallet and locked in Escrow immediately.
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm">
                            <Receipt className="w-5 h-5 text-white/40" />
                            <div>
                                <p className="font-bold">Freelancer receives (85%)</p>
                                <p className="text-xs text-white/40">Platform fee: 15%</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-mono font-bold text-brand-green">₹{(Number(form.reward_amount) * 0.85).toFixed(2)}</p>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-accent w-full flex justify-center items-center gap-2 text-base">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Locking Escrow…</> : 'Post Bounty & Lock Funds'}
                    </button>
                </form>
            </div>
        </div>
    );
}
