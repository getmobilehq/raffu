'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { submitEntryAction, type EntryState } from './actions';

const initialState: EntryState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-lg btn-block disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-primary-contrast)',
      }}
    >
      {pending ? 'Entering…' : "I'm in"}
    </button>
  );
}

export function EntryForm({ raffleId }: { raffleId: string }) {
  const action = submitEntryAction.bind(null, raffleId);
  const [state, formAction] = useFormState(action, initialState);

  if (state.ok) {
    return (
      <div className="card text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-contrast)',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="eyebrow mb-3">You&rsquo;re in</p>
        <h2 className="font-heading font-bold text-2xl tracking-tight mb-3">
          Good luck, {state.firstName}.
        </h2>
        <p className="text-mist leading-relaxed">
          Stay close to the screen — winners will be drawn live.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="card" noValidate>
      {state.error && (
        <div className="mb-6 border border-shadow bg-white rounded px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label htmlFor="firstName" className="field-label">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            autoCapitalize="words"
            required
            maxLength={60}
            defaultValue={state.firstName ?? ''}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="field-label">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            autoCapitalize="words"
            required
            maxLength={60}
            defaultValue={state.lastName ?? ''}
            className="field-input"
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
