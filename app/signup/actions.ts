'use server';

import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/emails/welcome';
import { redirect } from 'next/navigation';

export interface SignupState {
  error?: string;
  success?: boolean;
  confirmationRequired?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
}

function validate(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): string | null {
  if (!firstName || firstName.length < 1) return 'First name is required.';
  if (!lastName || lastName.length < 1) return 'Last name is required.';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Please enter a valid email address.';
  if (!password || password.length < 8)
    return 'Password must be at least 8 characters.';
  return null;
}

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const err = validate(firstName, lastName, email, password);
  if (err) return { error: err, firstName, lastName, email };

  const supabase = createClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    // Friendlier message for the most common case
    const msg = /already registered|already been registered/i.test(error.message)
      ? 'An account with this email already exists. Try logging in.'
      : error.message;
    return { error: msg, firstName, lastName, email };
  }

  // Fire-and-forget welcome email (fail-soft inside helper).
  // Intentionally not awaited-blocking; we still await so errors can be logged.
  await sendWelcomeEmail({ to: email, firstName });

  // If Supabase returned a session, the user is logged in immediately
  // (happens when email confirmations are disabled in the project).
  if (data.session) {
    redirect('/dashboard');
  }

  // Otherwise, tell them to check their email.
  return {
    success: true,
    confirmationRequired: true,
    firstName,
    lastName,
    email,
  };
}
