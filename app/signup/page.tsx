'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { BrandMark } from '@/components/brand-mark';
import { signupAction, type SignupState } from './actions';

const initialState: SignupState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary btn-lg btn-block disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating your account\u2026' : 'Start free trial'}
    </button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signupAction, initialState);

  if (state.confirmationRequired) {
    return <ConfirmEmailState email={state.email || ''} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandMark />
          <Link
            href="/login"
            className="text-sm font-medium text-shadow hover:text-mist transition-colors"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-[440px]">
          <p className="eyebrow mb-4">Start free</p>
          <h1 className="font-heading font-bold text-[2.5rem] leading-tight tracking-tighter mb-3">
            Your first month
            <br />
            is on us.
          </h1>
          <p className="text-mist mb-10 leading-relaxed">
            No card required. Full product for 30 days.
          </p>

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
                  defaultValue={state.lastName ?? ''}
                  className="field-input"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={state.email ?? ''}
                className="field-input"
              />
            </div>

            <div className="mb-8">
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                className="field-input"
              />
              <div className="mt-2 text-xs text-mist">
                At least 8 characters.
              </div>
            </div>

            <SubmitButton />

            <p className="mt-6 text-sm text-mist text-center">
              By creating an account you agree to our terms.
            </p>
          </form>

          <p className="mt-6 text-sm text-mist text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-shadow underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function ConfirmEmailState({ email }: { email: string }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <BrandMark />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-[440px] text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-shadow text-off-white mb-6">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <p className="eyebrow mb-4">Check your email</p>
          <h1 className="font-heading font-bold text-3xl tracking-tight mb-4">
            Confirm to finish signup.
          </h1>
          <p className="text-mist leading-relaxed mb-8">
            We&rsquo;ve sent a confirmation link to{' '}
            <span className="text-shadow font-medium">{email}</span>. Click it
            to activate your account and start your trial.
          </p>
          <Link href="/login" className="btn btn-ghost">
            Back to login
          </Link>
        </div>
      </main>
    </div>
  );
}
