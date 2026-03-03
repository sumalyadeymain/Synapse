"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteIdea(ideaId: string) {
    const supabase = await createClient();

    // Check admin status
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) return { error: "Not authorized" };

    // Delete the idea
    const { error: deleteError } = await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaId);

    if (deleteError) {
        return { error: deleteError.message };
    }

    revalidatePath('/admin/content');
    return { success: true };
}
