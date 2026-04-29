'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function deleteRaffleAction(formData: FormData) {
  const raffleId = String(formData.get('raffleId') ?? '');
  if (!raffleId) return;

  const supabase = createClient();

  // The status guard belt-and-braces the UI: only complete raffles are
  // deletable. Non-complete rows match zero rows and the call no-ops.
  // RLS via raffles_owner_all keeps this scoped to the owner.
  // FK cascades wipe entries + winners.
  const { error } = await supabase
    .from('raffles')
    .delete()
    .eq('id', raffleId)
    .eq('status', 'complete');

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function startDrawAction(formData: FormData) {
  const raffleId = String(formData.get('raffleId') ?? '');
  if (!raffleId) return;

  const supabase = createClient();

  const { error } = await supabase
    .from('raffles')
    .update({ status: 'drawing' })
    .eq('id', raffleId)
    .eq('status', 'collecting');

  // RLS limits this to the owner; if the row didn't move (already drawing,
  // wrong owner) the redirect still goes through and the draw page handles it.
  if (error) throw new Error(error.message);

  redirect(`/dashboard/raffles/${raffleId}/draw`);
}
