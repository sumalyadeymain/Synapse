import { createAdminClient } from "@/lib/supabase/admin";
import { Users, FileText, IndianRupee } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
    const supabase = createAdminClient();

    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: ideaCount } = await supabase.from('ideas').select('*', { count: 'exact', head: true });

    // Calculate total platform revenue (15% escrow fee)
    const { data: trades } = await supabase.from('trades').select('amount').in('status', ['RELEASED']);
    const totalRevenue = trades?.reduce((acc, trade) => acc + (trade.amount * 0.15), 0) || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Dashboard Overview</h1>
                <p className="text-white/50 text-sm mt-1">Platform metrics and system health.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex flex-col gap-4 border-t-2 border-t-brand-blue/50">
                    <div className="flex items-center gap-3 text-white/50 font-bold uppercase tracking-widest text-xs">
                        <Users className="w-4 h-4 text-brand-blue" /> Total Users
                    </div>
                    <div className="text-4xl font-black text-white">{userCount || 0}</div>
                </div>

                <div className="glass-card p-6 flex flex-col gap-4 border-t-2 border-t-brand-purple/50">
                    <div className="flex items-center gap-3 text-white/50 font-bold uppercase tracking-widest text-xs">
                        <FileText className="w-4 h-4 text-brand-purple" /> Active Ideas
                    </div>
                    <div className="text-4xl font-black text-white">{ideaCount || 0}</div>
                </div>

                <div className="glass-card p-6 flex flex-col gap-4 border-t-2 border-t-brand-green/50">
                    <div className="flex items-center gap-3 text-white/50 font-bold uppercase tracking-widest text-xs">
                        <IndianRupee className="w-4 h-4 text-brand-green" /> Total Rev (15%)
                    </div>
                    <div className="text-4xl font-black text-white font-mono">₹{totalRevenue.toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
}
