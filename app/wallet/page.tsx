"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wallet, Zap, CheckCircle2, Loader2, CreditCard } from "lucide-react";

const TOPUP_AMOUNTS = [100, 500, 1000, 2500, 5000];

function WalletContent() {
    const searchParams = useSearchParams();
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState<number | null>(null);
    const [error, setError] = useState("");

    const success = searchParams.get("success");
    const credited = searchParams.get("amount");
    const cancelled = searchParams.get("cancelled");

    useEffect(() => {
        (async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from("profiles").select("wallet_balance").eq("id", user.id).single();
            if (data) setBalance(Number(data.wallet_balance));
        })();
    }, []);

    const handleTopUp = async (amount: number) => {
        setError(""); setLoading(amount);
        const res = await fetch("/api/wallet/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount }),
        });
        const data = await res.json();
        setLoading(null);
        if (!res.ok) { setError(data.error || "Failed to create checkout session"); return; }
        window.location.href = data.url;
    };

    return (
        <>
            {/* Balance card */}
            <div className="glass-card text-center border border-brand-green/30 !py-10 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center justify-center gap-2">
                    <Wallet className="w-4 h-4" /> Available Balance
                </p>
                <p className="text-6xl font-mono font-extrabold text-brand-green mt-2">
                    {balance === null ? "—" : `₹${Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                </p>
            </div>

            {/* Notices */}
            {success && (
                <div className="flex items-center gap-3 p-4 bg-brand-green/10 border border-brand-green/30 rounded-xl text-brand-green font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    ₹{credited} has been credited to your wallet.
                </div>
            )}
            {cancelled && (
                <div className="flex items-center gap-3 p-4 bg-white/[0.04] border border-white/10 rounded-xl text-white/50 text-sm">
                    Payment cancelled. Nothing was charged.
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            {/* Top up options */}
            <div className="glass-card space-y-5">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand-blue" /> Top Up with Card
                </h2>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                    {TOPUP_AMOUNTS.map(amount => (
                        <button key={amount} onClick={() => handleTopUp(amount)} disabled={loading !== null}
                            className="flex flex-col items-center justify-center gap-1 bg-white/[0.04] hover:bg-brand-blue/10 border border-white/10 hover:border-brand-blue/40 rounded-xl p-4 transition-all group disabled:opacity-50">
                            {loading === amount
                                ? <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
                                : <Zap className="w-5 h-5 text-white/40 group-hover:text-brand-blue transition-colors" />}
                            <span className="text-lg font-mono font-bold group-hover:text-brand-blue transition-colors">₹{amount}</span>
                        </button>
                    ))}
                </div>
                <p className="text-xs text-white/30 border-t border-white/[0.06] pt-4">
                    Powered by Stripe. Payments are secure and encrypted. Credits are non-refundable.
                </p>
            </div>
        </>
    );
}

export default function WalletPage() {
    return (
        <div className="max-w-2xl mx-auto py-8 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-extrabold">Your Wallet</h1>
                <p className="text-white/50 text-sm">Load credits to unlock ideas and post bounties</p>
            </div>
            <Suspense fallback={
                <div className="glass-card text-center !py-10 text-white/30 text-sm">Loading wallet…</div>
            }>
                <WalletContent />
            </Suspense>
        </div>
    );
}
