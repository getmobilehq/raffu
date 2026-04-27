'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface LoginState {
  error?: string;
  email?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/dashboard');

  if (!email || !password) {
    return { error: 'Email and password are required.', email };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = /invalid login credentials/i.test(error.message)
      ? 'That email and password combination doesn\u2019t match any account.'
      : /email not confirmed/i.test(error.message)
        ? 'Please confirm your email address first \u2014 check your inbox.'
        : error.message;
    return { error: msg, email };
  }

  // Only redirect to in-app paths to prevent open-redirects
  const safeNext = next.startsWith('/') && !next.startsWith('//')
    ? next
    : '/dashboard';
  redirect(safeNext);
}
