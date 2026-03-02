import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Coins } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">

      {/* Hero Section */}
      <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-brand-blue/30 text-brand-blue text-xs font-semibold uppercase tracking-wider mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
          </span>
          Next-Gen Knowledge Marketplace
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Monetize your <br />
          <span className="text-gradient">Micro-IP.</span>
        </h1>
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
          Buy and sell byte-sized ideas, hacks, and solutions. Protected by our automated 24-hour escrow protocol. If it works, you get paid. If it's a scam, buyers get refunded.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link href="/discover" className="w-full sm:w-auto">
            <button className="btn-accent w-full flex items-center justify-center gap-2 text-lg">
              Explore Ideas <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <Link href="/idea/new" className="w-full sm:w-auto">
            <button className="btn-glass w-full text-lg py-3 px-8 border border-white/20 hover:border-white/40">
              Start Selling
            </button>
          </Link>
        </div>
      </div>

      {/* Feature Grids */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mt-16">
        <div className="glass-card flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-full bg-brand-blue/10 text-brand-blue">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">AI Vetted Quality</h3>
          <p className="text-sm text-white/60">Every idea passes through our vector-embedding AI to filter out low-effort or duplicate entries.</p>
        </div>

        <div className="glass-card flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-full bg-brand-green/10 text-brand-green">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">24-Hour Escrow</h3>
          <p className="text-sm text-white/60">Funds are locked in a PENDING state for 24 hours. The buyer can review the content, complain if invalid.</p>
        </div>

        <div className="glass-card flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-full bg-white/5 text-white">
            <Coins className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Instant Settlements</h3>
          <p className="text-sm text-white/60">Once the escrow clears, 85% of the transaction is instantly credited to your withdrawal wallet.</p>
        </div>
      </div>

    </div>
  );
}
