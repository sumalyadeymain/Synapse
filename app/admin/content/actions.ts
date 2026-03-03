"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function deleteIdea(ideaId: string) {
    const admin = createAdminClient(); // Use admin client to bypass RLS

    // Check auth via standard client first (to get current session)
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await admin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.is_admin || user.email === 'sumalyadey1@gmail.com';

    if (!isAdmin) return { error: "Not authorized" };

    // Delete the idea using the admin client (bypasses RLS)
    const { error: deleteError } = await admin
        .from('ideas')
        .delete()
        .eq('id', ideaId);

    if (deleteError) {
        console.error("Delete error:", deleteError);
        return { error: "Could not delete idea. It might be linked to existing trades or commissions. Details: " + deleteError.message };
    }

    revalidatePath('/admin/content');
    revalidatePath('/discover');
    return { success: true };
}
