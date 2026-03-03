import { createAdminClient } from "@/lib/supabase/admin";
import { User, ShieldCheck, ShieldAlert, IndianRupee } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
    const supabase = createAdminClient(); // Use admin client to bypass RLS

    // Fetch all profiles - select specific columns to avoid crash if is_admin is missing
    const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_emoji, wallet_balance, created_at, iq_score') // removed email
        .order('created_at', { ascending: false });

    // Optional: Try to fetch is_admin separately to see if it exists
    const { data: adminCheck } = await supabase.from('profiles').select('is_admin').limit(1);
    const hasAdminColumn = adminCheck !== null;

    // If column exists, we can re-fetch with it or just map it if we really need it
    // For now, let's just make it work with what we have.

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <User className="w-8 h-8 text-brand-blue" /> User Management
                </h1>
                <p className="text-white/50 text-sm mt-1">View and manage all registered users.</p>
            </div>

            {error ? (
                <div className="p-4 bg-red-500/20 border border-red-500 text-red-500 rounded-xl font-bold">
                    Error loading users: {error.message}
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">User</th>
                                    <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">IQ Score</th>
                                    <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">Wallet</th>
                                    <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">Role</th>
                                    <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-widest">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users?.map((u: any) => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg">
                                                    {u.avatar_emoji || '👤'}
                                                </div>
                                                <div className="font-bold text-white">{u.username || 'Anonymous'}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-brand-purple font-bold">
                                            {u.iq_score}
                                        </td>
                                        <td className="p-4 font-mono text-brand-green font-bold flex items-center gap-1">
                                            <IndianRupee className="w-3 h-3" /> {u.wallet_balance}
                                        </td>
                                        <td className="p-4">
                                            {u.is_admin || u.username === 'Sumalya' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-brand-blue/20 text-brand-blue uppercase tracking-tighter">
                                                    <ShieldCheck className="w-3 h-3" /> Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-white/50 uppercase tracking-tighter">
                                                    User
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-white/50">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
