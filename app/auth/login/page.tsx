"use client";
import { BrainCircuit } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signIn } from "@/app/auth/actions";

function LoginContent() {
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/discover";
    const hasError = searchParams.get("error") === "bad_credentials";

    return (
        <div className="glass-card !p-8 space-y-6 glow-blue">
            {hasError && (
                <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    ❌ Wrong email or password — try again.
                </div>
            )}

            {/* Server Action Form */}
            <form action={signIn} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-blue focus:outline-none transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">
                        Password
                    </label>
                    <input
                        type="password"
                        name="password"
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-blue focus:outline-none transition-colors"
                    />
                </div>

                <button
                    type="submit"
                    className="btn-accent w-full flex justify-center items-center gap-2 mt-2"
                >
                    Sign In
                </button>
            </form>

            <div className="border-t border-white/[0.06] pt-5 text-center text-sm text-white/40">
                No account?{" "}
                <Link href="/auth/signup" className="text-brand-blue hover:text-brand-green transition-colors font-semibold">
                    Create one →
                </Link>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-3">
                    <BrainCircuit className="w-12 h-12 text-brand-blue mx-auto drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]" />
                    <h1 className="text-3xl font-extrabold">Welcome Back</h1>
                    <p className="text-white/50 text-sm">Sign in to your Synapse account</p>
                </div>
                <Suspense fallback={<div className="glass-card !p-8 text-center text-white/40 text-sm">Loading…</div>}>
                    <LoginContent />
                </Suspense>
            </div>
        </div>
    );
}
