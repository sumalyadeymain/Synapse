import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShieldCheck, Users, LayoutDashboard, FileText, ChevronLeft, Menu } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login?redirect=/admin');
    }

    // Fetch profile and check admin status with email fallback
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.is_admin || user.email === 'sumalyadey1@gmail.com';

    if (!isAdmin) {
        // Not an admin, redirect to home
        redirect('/');
    }

    return (
        <div className="flex min-h-screen bg-black text-white selection:bg-brand-blue/30 selection:text-white">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-black/50 p-6 flex flex-col gap-8 hidden md:flex shrink-0 sticky top-0 h-screen">
                <div className="flex items-center gap-2 text-brand-blue font-black tracking-widest uppercase">
                    <ShieldCheck className="w-6 h-6" />
                    <span>Admin Panel</span>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-colors text-white/70 hover:text-white font-medium">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-colors text-white/70 hover:text-white font-medium">
                        <Users className="w-5 h-5" /> Users
                    </Link>
                    <Link href="/admin/content" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-colors text-white/70 hover:text-white font-medium">
                        <FileText className="w-5 h-5" /> Moderation
                    </Link>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10">
                    <Link href="/" className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back to Synapse
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 w-full min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden border-b border-white/10 p-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-50">
                    <div className="flex items-center gap-2 text-brand-blue font-black tracking-widest uppercase text-sm">
                        <ShieldCheck className="w-5 h-5" /> Admin
                    </div>
                    <button className="text-white/70 hover:text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}