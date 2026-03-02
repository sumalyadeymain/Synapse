"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrainCircuit, Loader2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "", username: "", emoji: "🧠" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const EMOJIS = ["🧠", "⚡", "🔐", "🏗️", "🚀", "🎯", "💡", "🔮"];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setLoading(true);

        try {
            // Raw HTTP POST directly to our own Node.js server
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    username: form.username,
                    avatar_emoji: form.emoji
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to create account.");
                setLoading(false);
                return;
            }

            // Success! Route them to check-email
            router.push('/auth/check-email');
        } catch (err: any) {
            console.error("Signup catch:", err);
            setError(err.name === 'TypeError' ? "Network Error: Reconnecting to dev server" : err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-3">
                    <BrainCircuit className="w-12 h-12 text-brand-blue mx-auto drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]" />
                    <h1 className="text-3xl font-extrabold">Join Synapse</h1>
                    <p className="text-white/50 text-sm">Create your account and start earning</p>
                </div>

                <div className="glass-card !p-8 space-y-6 glow-blue">
                    {error && (
                        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-5">
                        {/* Avatar emoji picker */}
                        <div>
                            <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Your Avatar</label>
                            <div className="flex gap-2 flex-wrap">
                                {EMOJIS.map(e => (
                                    <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })}
                                        className={`text-2xl w-10 h-10 rounded-xl border transition-all ${form.emoji === e ? 'border-brand-blue bg-brand-blue/20 scale-110' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Username</label>
                            <input name="username" required value={form.username} onChange={handleChange}
                                placeholder="NeuralHacker"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-blue focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Email</label>
                            <input name="email" type="email" required value={form.email} onChange={handleChange}
                                placeholder="you@example.com"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-blue focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Password</label>
                            <input name="password" type="password" required minLength={6} value={form.password} onChange={handleChange}
                                placeholder="6+ characters"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-blue focus:outline-none transition-colors"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn-accent w-full flex justify-center items-center gap-2 mt-2">
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
                        </button>
                    </form>

                    <div className="border-t border-white/[0.06] pt-5 text-center text-sm text-white/40">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-brand-blue hover:text-brand-green transition-colors font-semibold">
                            Sign In →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
