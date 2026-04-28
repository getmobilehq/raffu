'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function completeRaffleAction(formData: FormData) {
  const raffleId = String(formData.get('raffleId') ?? '');
  if (!raffleId) return;

  const supabase = createClient();

  const { error } = await supabase
    .from('raffles')
    .update({ status: 'complete' })
    .eq('id', raffleId)
    .eq('status', 'drawing');

  if (error) throw new Error(error.message);

  redirect(`/dashboard/raffles/${raffleId}`);
}
