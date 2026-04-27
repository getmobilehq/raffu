'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { loginAction, type LoginState } from './actions';

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary btn-lg btn-block disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Signing you in\u2026' : 'Log in'}
    </button>
  );
}

function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const search = useSearchParams();
  const next = search.get('next') ?? '/dashboard';

  return (
    <form action={formAction} className="card" noValidate>
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <div className="mb-6 border border-shadow bg-white rounded px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

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
          autoComplete="current-password"
          required
          className="field-input"
        />
      </div>

      <SubmitButton />
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandMark />
          <Link
            href="/signup"
            className="text-sm font-medium text-shadow hover:text-mist transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-[440px]">
          <p className="eyebrow mb-4">Welcome back</p>
          <h1 className="font-heading font-bold text-[2.5rem] leading-tight tracking-tighter mb-10">
            Log in to Raffu.
          </h1>

          <Suspense fallback={<div className="card">{'Loading\u2026'}</div>}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-sm text-mist text-center">
            New here?{' '}
            <Link href="/signup" className="text-shadow underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
