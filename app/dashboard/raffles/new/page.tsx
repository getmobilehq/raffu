'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  createRaffleAction,
  type PrizeMode,
  type RaffleSetupState,
  type SpinStyle,
  type WinnerMode,
} from './actions';

const initialState: RaffleSetupState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary btn-lg btn-block disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating raffle…' : 'Create raffle'}
    </button>
  );
}

export default function NewRafflePage() {
  const [state, formAction] = useFormState(createRaffleAction, initialState);

  const [winnerMode, setWinnerMode] = useState<WinnerMode>(
    state.winnerMode ?? 'count'
  );
  const [prizeMode, setPrizeMode] = useState<PrizeMode>(
    state.prizeMode ?? 'same'
  );
  const [spinStyle, setSpinStyle] = useState<SpinStyle>(
    state.spinStyle ?? 'slot'
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-mist hover:text-shadow transition-colors"
      >
        &larr; Dashboard
      </Link>

      <p className="eyebrow mt-6 mb-4">New raffle</p>
      <h1 className="font-heading font-bold text-4xl md:text-5xl tracking-tighter mb-3">
        Set it up.
      </h1>
      <p className="text-mist mb-12 leading-relaxed">
        Name it, brand it, pick the winner rule. You can edit anything before
        the draw.
      </p>

      <form action={formAction} className="card" noValidate>
        {state.error && (
          <div className="mb-6 border border-shadow bg-white rounded px-4 py-3 text-sm">
            {state.error}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="name" className="field-label">
            Raffle name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={80}
            defaultValue={state.name ?? ''}
            placeholder="Friday night giveaway"
            className="field-input"
          />
        </div>

        <fieldset className="mb-8">
          <legend className="field-label">Brand colors</legend>
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              id="primaryColor"
              label="Primary"
              defaultValue={state.primaryColor ?? '#E10A0A'}
            />
            <ColorField
              id="accentColor"
              label="Accent"
              defaultValue={state.accentColor ?? '#0050FF'}
            />
          </div>
        </fieldset>

        <fieldset className="mb-8">
          <legend className="field-label">Winner rule</legend>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <RadioCard
              name="winnerMode"
              value="count"
              label="Fixed count"
              hint="A set number of winners"
              checked={winnerMode === 'count'}
              onChange={() => setWinnerMode('count')}
            />
            <RadioCard
              name="winnerMode"
              value="percent"
              label="Percent of entries"
              hint="Scales with the crowd"
              checked={winnerMode === 'percent'}
              onChange={() => setWinnerMode('percent')}
            />
          </div>
          {winnerMode === 'count' ? (
            <NumberField
              id="winnerCount"
              label="How many winners"
              defaultValue={state.winnerCount ?? 3}
              min={1}
              max={1000}
            />
          ) : (
            <NumberField
              id="winnerPercent"
              label="Percent of entries"
              defaultValue={state.winnerPercent ?? 10}
              min={1}
              max={100}
              suffix="%"
            />
          )}
          {/* Always render the inactive field's value as a hidden input so
              switching modes after a validation error doesn't lose the value. */}
          {winnerMode === 'count' ? (
            <input
              type="hidden"
              name="winnerPercent"
              value={state.winnerPercent ?? 10}
            />
          ) : (
            <input
              type="hidden"
              name="winnerCount"
              value={state.winnerCount ?? 3}
            />
          )}
        </fieldset>

        <fieldset className="mb-8">
          <legend className="field-label">Prize</legend>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <RadioCard
              name="prizeMode"
              value="same"
              label="Same for everyone"
              hint="One prize, all winners"
              checked={prizeMode === 'same'}
              onChange={() => setPrizeMode('same')}
            />
            <RadioCard
              name="prizeMode"
              value="per"
              label="Tiered"
              hint="One prize per winner"
              checked={prizeMode === 'per'}
              onChange={() => setPrizeMode('per')}
            />
          </div>
          {prizeMode === 'same' ? (
            <input
              id="prizeText"
              name="prizeText"
              type="text"
              maxLength={200}
              defaultValue={state.prizeText ?? ''}
              placeholder="A bottle of something good"
              className="field-input"
            />
          ) : (
            <textarea
              id="prizeList"
              name="prizeList"
              rows={5}
              defaultValue={state.prizeList ?? ''}
              placeholder="One prize per line, in draw order:&#10;1st — weekend trip&#10;2nd — dinner for two&#10;3rd — bar tab"
              className="field-input resize-y"
            />
          )}
          {/* Preserve the inactive field on mode toggle (same reason as winner). */}
          {prizeMode === 'same' ? (
            <input
              type="hidden"
              name="prizeList"
              value={state.prizeList ?? ''}
            />
          ) : (
            <input
              type="hidden"
              name="prizeText"
              value={state.prizeText ?? ''}
            />
          )}
        </fieldset>

        <fieldset className="mb-10">
          <legend className="field-label">Draw animation</legend>
          <div className="grid grid-cols-3 gap-3">
            <RadioCard
              name="spinStyle"
              value="slot"
              label="Slot"
              hint="Reels spin"
              checked={spinStyle === 'slot'}
              onChange={() => setSpinStyle('slot')}
            />
            <RadioCard
              name="spinStyle"
              value="flash"
              label="Flash"
              hint="Names cycle fast"
              checked={spinStyle === 'flash'}
              onChange={() => setSpinStyle('flash')}
            />
            <RadioCard
              name="spinStyle"
              value="shuffle"
              label="Shuffle"
              hint="Cards shuffle"
              checked={spinStyle === 'shuffle'}
              onChange={() => setSpinStyle('shuffle')}
            />
          </div>
        </fieldset>

        <SubmitButton />
      </form>
    </div>
  );
}

function ColorField({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-mist mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`${label} color picker`}
          className="h-12 w-12 rounded border border-border bg-white cursor-pointer p-1"
        />
        <input
          id={id}
          name={id}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          pattern="^#[0-9a-fA-F]{6}$"
          className="field-input flex-1 font-mono text-sm uppercase"
        />
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  defaultValue,
  min,
  max,
  suffix,
}: {
  id: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-mist mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          name={id}
          type="number"
          defaultValue={defaultValue}
          min={min}
          max={max}
          required
          className="field-input flex-1"
        />
        {suffix && <span className="text-mist text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

function RadioCard({
  name,
  value,
  label,
  hint,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`block cursor-pointer rounded border px-4 py-3 transition-colors ${
        checked
          ? 'border-shadow bg-off-white'
          : 'border-border bg-white hover:border-mist'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className="font-medium text-sm text-shadow">{label}</div>
      <div className="text-xs text-mist mt-0.5">{hint}</div>
    </label>
  );
}
