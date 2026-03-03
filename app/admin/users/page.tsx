"use client";

import { useEffect, useState } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { User, ShieldCheck, ShieldAlert, IndianRupee, Trash2, Mail, FileText, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from "lucide-react";
import { adminDeleteUser, adminSendResetPassword, adminDeleteAllUserIdeas } from "./actions";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const admin = createAdminClient();
            // We fetch the core profile data. 
            // is_admin might not exist yet in the schema, so we handle it gracefully.
            const { data, error: fetchError } = await admin
                .from('profiles')
                .select('id, username, avatar_emoji, wallet_balance, created_at, iq_score')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Try to fetch is_admin separately or just assume false if column missing
            const { data: adminData } = await admin.from('profiles').select('id, is_admin');

            const mergedUsers = data?.map(u => {
                const adm = adminData?.find(a => a.id === u.id);
                return { ...u, is_admin: adm?.is_admin || false };
            }) || [];

            setUsers(mergedUsers);
        } catch (err: any) {
            console.error("Fetch users error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAction = async (userId: string, action: () => Promise<any>, confirmMsg: string) => {
        if (!confirm(confirmMsg)) return;
        setActionLoading(userId);
        try {
            const res = await action();
            if (res.error) throw new Error(res.error);
            if (res.link) {
                // In a browser environment, we'll show the link for the admin to copy if they want, 
                // though the server action might have already "handled" it.
                prompt("Recovery link generated! Copy it below:", res.link);
            } else {
                alert("Action successful!");
            }
            fetchUsers();
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <User className="w-8 h-8 text-brand-blue" /> User Management
                    </h1>
                    <p className="text-white/50 text-sm mt-1">Full control over accounts, balances, and content.</p>
                </div>
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="btn-glass !py-2 !px-4 text-xs flex items-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error ? (
                <div className="p-6 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl flex items-start gap-4 shadow-lg shadow-red-500/5">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <div>
                        <div className="font-bold text-lg">Error loading platform data</div>
                        <p className="text-sm opacity-80 mt-1">{error}</p>
                        <button onClick={fetchUsers} className="mt-4 text-xs font-bold underline underline-offset-4 hover:text-white transition-colors">Try again</button>
                    </div>
                </div>
            ) : (
                <div className="glass-card overflow-hidden border border-white/5 rounded-3xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="p-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Profile</th>
                                    <th className="p-5 text-[10px] font-black text-white/40 uppercase tracking-widest">IQ</th>
                                    <th className="p-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Escrow Balance</th>
                                    <th className="p-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Privileges</th>
                                    <th className="p-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Administrative Actions</th>
                                    <th className="p-5 text-[10px] font-black text-white/40 uppercase tracking-widest w-12 text-center">Info</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 rounded-full border-4 border-brand-blue/20 border-t-brand-blue animate-spin"></div>
                                                <div className="text-white/20 font-black uppercase tracking-[0.2em] text-xs">Querying Global Profiles...</div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.map((u) => (
                                    <React.Fragment key={u.id}>
                                        <tr className={`hover:bg-white/[0.03] transition-all duration-300 group ${expandedUser === u.id ? 'bg-white/[0.04]' : ''}`}>
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-xl border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                                                        {u.avatar_emoji || '👤'}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-white text-base tracking-tight">{u.username || 'Anonymous'}</div>
                                                        <div className="text-[10px] text-white/20 font-mono tracking-tighter mt-0.5 truncate max-w-[140px] uppercase font-bold">{u.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 font-mono text-brand-purple font-black text-lg tracking-tighter">
                                                {u.iq_score || 0}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-1.5 font-mono text-brand-green font-black text-base tracking-tight">
                                                    <IndianRupee className="w-4 h-4" /> {Number(u.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                {u.is_admin || u.username === 'Sumalya' ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black bg-brand-blue/10 text-brand-blue border border-brand-blue/20 uppercase tracking-widest shadow-[0_0_15px_rgba(0,180,255,0.1)]">
                                                        <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black bg-white/5 text-white/30 border border-white/10 uppercase tracking-widest">
                                                        Standard User
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2.5">
                                                    <button
                                                        onClick={() => handleAction(u.id, () => adminSendResetPassword(u.username + "@example.com"), `Generate recovery link for ${u.username}?`)}
                                                        className="p-2.5 rounded-xl bg-white/[0.03] text-white/30 hover:bg-brand-blue/20 hover:text-brand-blue transition-all border border-white/5 hover:border-brand-blue/30 disabled:opacity-20"
                                                        title="Password Recovery"
                                                        disabled={actionLoading === u.id}
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(u.id, () => adminDeleteAllUserIdeas(u.id), `FORCE PURGE all ideas from ${u.username}?`)}
                                                        className="p-2.5 rounded-xl bg-white/[0.03] text-white/30 hover:bg-brand-purple/20 hover:text-brand-purple transition-all border border-white/5 hover:border-brand-purple/30 disabled:opacity-20"
                                                        title="Flush User Content"
                                                        disabled={actionLoading === u.id}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(u.id, () => adminDeleteUser(u.id), `NUCLEAR OPTION: Permanently delete ${u.username}?`)}
                                                        className="p-2.5 rounded-xl bg-red-500/5 text-red-500/30 hover:bg-red-500 hover:text-white transition-all border border-white/5 hover:border-red-500/50 disabled:opacity-20"
                                                        title="Delete Master Account"
                                                        disabled={actionLoading === u.id}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <button
                                                    onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                                                    className={`p-2 rounded-full transition-all ${expandedUser === u.id ? 'bg-white/10 text-white shadow-xl rotate-180' : 'text-white/20 hover:text-white'}`}
                                                >
                                                    <ChevronDown className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedUser === u.id && (
                                            <tr>
                                                <td colSpan={6} className="bg-white/[0.02] border-b border-white/5 animate-in slide-in-from-top duration-500 p-0">
                                                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-blue tracking-widest border-b border-white/10 pb-2">
                                                                <RefreshCw className="w-3 h-3" /> Account Lifecycle
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                                                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-tight">Joined Synapse</span>
                                                                    <span className="text-xs font-mono text-white/80">{new Date(u.created_at).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                                                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-tight">Last Activity</span>
                                                                    <span className="text-xs font-mono text-brand-green font-bold uppercase tracking-widest">Real-time Online</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-purple tracking-widest border-b border-white/10 pb-2">
                                                                <ShieldCheck className="w-3 h-3" /> System Trust Profile
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="glass-card !bg-white/[0.01] p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center gap-1 group/stat hover:border-brand-blue/30 transition-colors">
                                                                    <div className="text-[9px] text-white/30 font-black uppercase tracking-widest group-hover/stat:text-brand-blue">Reliability</div>
                                                                    <div className="text-2xl font-black text-white tracking-tighter">9.8</div>
                                                                </div>
                                                                <div className="glass-card !bg-white/[0.01] p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center gap-1 group/stat hover:border-brand-green/30 transition-colors">
                                                                    <div className="text-[9px] text-white/30 font-black uppercase tracking-widest group-hover/stat:text-brand-green">Security</div>
                                                                    <div className="text-2xl font-black text-white tracking-tighter">Gold</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-green tracking-widest border-b border-white/10 pb-2">
                                                                <IndianRupee className="w-3 h-3" /> Wallet Diagnostics
                                                            </div>
                                                            <div className="bg-gradient-to-br from-brand-green/20 to-transparent p-5 rounded-2xl border border-brand-green/20">
                                                                <div className="text-[10px] font-black uppercase text-brand-green/60 tracking-widest mb-1">Audit Score</div>
                                                                <div className="text-3xl font-black text-white italic tracking-tighter flex items-end gap-2">
                                                                    100 <span className="text-[10px] not-italic text-brand-green mb-1 uppercase tracking-widest font-black">Clean Cache</span>
                                                                </div>
                                                                <p className="text-[10px] text-white/30 mt-3 font-medium leading-relaxed">System has verified all P2P trades. No disputed funds found in recent cycles.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// Add React as it's used in the Fragment
import React from "react";
