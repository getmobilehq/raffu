'use server';

import { createClient } from '@/lib/supabase/server';

export interface EntryState {
  ok?: boolean;
  error?: string;
  firstName?: string;
  lastName?: string;
}

export async function submitEntryAction(
  raffleId: string,
  _prev: EntryState,
  formData: FormData
): Promise<EntryState> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();

  if (!firstName || firstName.length < 1)
    return { error: 'First name is required.', firstName, lastName };
  if (!lastName || lastName.length < 1)
    return { error: 'Last name is required.', firstName, lastName };
  if (firstName.length > 60 || lastName.length > 60)
    return { error: 'Names must be 60 characters or fewer.', firstName, lastName };

  const supabase = createClient();

  const { error } = await supabase
    .from('entries')
    .insert({ raffle_id: raffleId, first_name: firstName, last_name: lastName });

  if (error) {
    // RLS rejects insert when status != 'collecting'. PostgREST returns 42501
    // (insufficient privilege) for that case.
    const closed =
      error.code === '42501' ||
      /row-level security|policy/i.test(error.message);
    return {
      error: closed
        ? 'Entries are closed for this raffle.'
        : error.message,
      firstName,
      lastName,
    };
  }

  return { ok: true, firstName };
}
