'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function deleteRaffleAction(formData: FormData) {
  const raffleId = String(formData.get('raffleId') ?? '');
  if (!raffleId) return;

  const supabase = createClient();

  // RLS via raffles_owner_all keeps this scoped to the owner.
  // FK cascades wipe entries + winners.
  const { error } = await supabase
    .from('raffles')
    .delete()
    .eq('id', raffleId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function reopenRaffleAction(formData: FormData) {
  const raffleId = String(formData.get('raffleId') ?? '');
  if (!raffleId) return;

  const supabase = createClient();

  // Fetch current_round so we can increment it. Status guard in the WHERE
  // means non-complete raffles silently no-op.
  const { data: row } = await supabase
    .from('raffles')
    .select('current_round')
    .eq('id', raffleId)
    .eq('status', 'complete')
    .maybeSingle();

  if (!row) return;

  const { error } = await supabase
    .from('raffles')
    .update({ status: 'collecting', current_round: row.current_round + 1 })
    .eq('id', raffleId)
    .eq('status', 'complete');

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/raffles/${raffleId}`);
  redirect(`/dashboard/raffles/${raffleId}`);
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
