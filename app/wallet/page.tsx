import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import WalletClient from "./WalletClient";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login?redirect=/wallet");
    }

    // Fetch profile on the server (Admin client bypasses any RLS issues)
    const admin = createAdminClient();
    const { data: profile } = await admin
        .from("profiles")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

    const balance = profile?.wallet_balance ?? 0;

    return (
        <div className="max-w-2xl mx-auto py-8 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-extrabold">Your Wallet</h1>
                <p className="text-white/50 text-sm">Load credits to unlock ideas and post bounties</p>
            </div>

            <Suspense fallback={
                <div className="glass-card text-center !py-10 text-white/30 text-sm">Loading wallet…</div>
            }>
                <WalletClient initialBalance={Number(balance)} />
            </Suspense>
        </div>
    );
}
