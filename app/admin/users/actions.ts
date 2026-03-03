"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Checks if the current user is an authorized admin.
 * Uses hardcoded email fallback for safety.
 */
async function ensureAdmin() {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { authorized: false, error: "Not authenticated" };

    const admin = createAdminClient();
    const { data: profile } = await admin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.is_admin || user.email === 'sumalyadey1@gmail.com';

    if (!isAdmin) return { authorized: false, error: "Not authorized" };

    return { authorized: true, user, adminClient: admin };
}

/**
 * Deletes a user from both Profiles and Supabase Auth.
 */
export async function adminDeleteUser(userId: string) {
    const adminCheck = await ensureAdmin();
    if (!adminCheck.authorized) return { error: adminCheck.error };

    const admin = adminCheck.adminClient;
    if (!admin) return { error: "Unauthorized" };

    // 1. Delete user profile (cascades to their ideas/trades usually, but we should be explicit if needed)
    // Note: Profiles table might have FKs from ideas. Let's delete content first.
    await admin.from('ideas').delete().eq('seller_id', userId);

    const { error: profileError } = await admin
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (profileError) return { error: "Profile deletion failed: " + profileError.message };

    // 2. Delete user from Supabase Auth
    const { error: authError } = await admin.auth.admin.deleteUser(userId);

    if (authError) return { error: "Auth deletion failed: " + authError.message };

    revalidatePath('/admin/users');
    return { success: true };
}

/**
 * Sends a password reset link to a user.
 */
export async function adminSendResetPassword(email: string) {
    const adminCheck = await ensureAdmin();
    if (!adminCheck.authorized) return { error: adminCheck.error };

    const admin = adminCheck.adminClient;
    if (!admin) return { error: "Unauthorized" };

    const { error } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
    });

    if (error) return { error: "Failed to generate reset link: " + error.message };

    // Note: Usually generateLink returns the link. Supabase also has resetPasswordForEmail.
    // admin.resetPasswordForEmail is easier as it sends the email automatically.
    const { error: resetError } = await adminCheck.adminClient.auth.admin.inviteUserByEmail(email);
    // Actually, resetPasswordForEmail is not in admin.auth.admin. 
    // We'll use generateLink or just rely on the user triggering it, but since the user asked for "send recovery link":

    const { data, error: sendError } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
            redirectTo: 'https://synapse-git-main-sumalya-deys-projects.vercel.app/auth/reset-password'
        }
    });

    if (sendError) return { error: sendError.message };

    return { success: true, link: data.properties.action_link };
}

/**
 * Deletes all ideas posted by a specific user.
 */
export async function adminDeleteAllUserIdeas(userId: string) {
    const adminCheck = await ensureAdmin();
    if (!adminCheck.authorized) return { error: adminCheck.error };

    const admin = adminCheck.adminClient;
    if (!admin) return { error: "Unauthorized" };

    const { error } = await admin
        .from('ideas')
        .delete()
        .eq('seller_id', userId);

    if (error) return { error: error.message };

    revalidatePath('/admin/users');
    revalidatePath('/admin/content');
    revalidatePath('/discover');
    return { success: true };
}

/**
 * Adjusts a user's wallet balance.
 */
export async function adminAdjustBalance(userId: string, newBalance: number) {
    const adminCheck = await ensureAdmin();
    if (!adminCheck.authorized) return { error: adminCheck.error };

    const admin = adminCheck.adminClient;
    if (!admin) return { error: "Unauthorized" };

    const { error } = await admin
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', userId);

    if (error) return { error: error.message };

    revalidatePath('/admin/users');
    return { success: true };
}
