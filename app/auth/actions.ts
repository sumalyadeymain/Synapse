'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const redirectTo = formData.get('redirectTo') as string || '/discover'

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) redirect(`/auth/login?error=bad_credentials`)
    redirect(redirectTo)
}

export async function signUp(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string
    const avatar_emoji = formData.get('avatar_emoji') as string

    const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username, avatar_emoji: avatar_emoji || '🧠' } }
    })
    if (error) redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`)
    redirect('/auth/check-email')
}

import { cookies } from 'next/headers'

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    // Clear out the stale development cookie if it exists
    const cookieStore = await cookies()
    cookieStore.delete('local_session')

    redirect('/')
}
