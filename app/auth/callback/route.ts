import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles the redirect target from Supabase confirmation emails
 * (and OAuth, if added later). Exchanges the ?code=... for a session cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const safeNext = next.startsWith('/') && !next.startsWith('//')
        ? next
        : '/dashboard';
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // On failure, send them to login with a friendly notice
  return NextResponse.redirect(`${origin}/login?error=confirm`);
}
