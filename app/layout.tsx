import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { BrainCircuit, LayoutDashboard, Compass, Target, LogIn, LogOut, Wallet, PlusCircle } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Synapse — P2P Micro-IP Exchange",
  description: "Buy, sell, and commission ideas, hacks, and solutions with 24-hour automated escrow.",
};

import { createClient } from "@/lib/supabase/server";

// Fetch genuine Supabase user + wallet balance
async function getNavigationUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch profile data (wallet, username, emoji)
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("username, avatar_emoji, wallet_balance")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    return {
      id: user.id,
      email: user.email,
      username: profile.username,
      avatar_emoji: profile.avatar_emoji,
      wallet_balance: profile.wallet_balance
    };
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getNavigationUser();

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>

        {/* ─── NAVBAR ─── */}
        <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 h-[60px] flex items-center justify-between gap-6">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <BrainCircuit className="w-7 h-7 text-brand-blue transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
              <span className="text-lg font-extrabold tracking-tight">Synapse</span>
            </Link>

            {/* Center Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/discover" className="nav-link flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Discover
              </Link>
              <Link href="/bounties" className="nav-link flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Bounties
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
              </Link>
              {user && (
                <Link href="/dashboard/seller" className="nav-link flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
              )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Profile badge */}
                  <div className="hidden sm:flex items-center gap-1.5 bg-brand-purple/10 border border-brand-purple/20 rounded-full px-3 py-1">
                    <span className="text-brand-purple text-xs font-bold">{user.avatar_emoji}</span>
                    <span className="text-[11px] font-semibold text-white/80">{user.username}</span>
                  </div>

                  {/* Wallet balance */}
                  <Link href="/wallet" className="flex items-center gap-1.5 glass rounded-full py-1.5 px-3 hover:border-brand-green/30 border border-transparent transition-colors group">
                    <Wallet className="w-3.5 h-3.5 text-brand-green" />
                    <span className="text-sm font-bold font-mono text-brand-green">
                      ₹{Number(user.wallet_balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <PlusCircle className="w-3 h-3 text-white/20 group-hover:text-brand-green transition-colors" />
                  </Link>

                  <Link href="/idea/new" className="hidden md:block">
                    <button className="btn-accent py-2 px-4 text-xs font-bold">+ Post Idea</button>
                  </Link>

                  {/* Sign out — clears local cookie */}
                  <form method="POST" action="/api/auth/do-logout">
                    <button type="submit" className="btn-glass !py-1.5 !px-3 text-xs flex items-center gap-1.5">
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/auth/login">
                  <button className="btn-accent py-2 px-5 text-sm flex items-center gap-1.5">
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* ─── CONTENT ─── */}
        <main className="flex-grow pt-[76px] pb-16 px-4 max-w-7xl mx-auto w-full">
          {children}
        </main>

        <footer className="border-t border-white/[0.05] py-6 px-4 text-center text-xs text-white/20">
          Synapse v2.0 · Micro-IP Exchange · All escrow is automated and auditable
        </footer>
      </body>
    </html>
  );
}
