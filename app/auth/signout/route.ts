import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}

// Allow GET for convenience (link clicks) — harmless because we clear server-side
export async function GET(request: NextRequest) {
  return POST(request);
}
