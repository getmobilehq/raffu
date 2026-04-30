'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type {
  PrizeMode,
  RaffleSetupState,
  SpinStyle,
  WinnerMode,
} from '@/app/dashboard/raffles/new/actions';

const initialState: RaffleSetupState = {};

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary btn-lg btn-block disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function RaffleForm({
  action,
  initialValues = {},
  submitLabel,
  pendingLabel,
  showSlugField = false,
}: {
  action: (
    prev: RaffleSetupState,
    formData: FormData
  ) => Promise<RaffleSetupState>;
  initialValues?: Partial<RaffleSetupState>;
  submitLabel: string;
  pendingLabel: string;
  /** Show an optional "URL slug" input. Edit mode keeps slugs immutable
   *  so already-shared QR codes stay valid, hence the prop. */
  showSlugField?: boolean;
}) {
  const [state, formAction] = useFormState(action, initialState);

  // Defaults precedence: validation echo > initialValues > hardcoded.
  const winnerModeDefault: WinnerMode =
    state.winnerMode ?? initialValues.winnerMode ?? 'count';
  const prizeModeDefault: PrizeMode =
    state.prizeMode ?? initialValues.prizeMode ?? 'same';
  const spinStyleDefault: SpinStyle =
    state.spinStyle ?? initialValues.spinStyle ?? 'slot';

  const [winnerMode, setWinnerMode] = useState<WinnerMode>(winnerModeDefault);
  const [prizeMode, setPrizeMode] = useState<PrizeMode>(prizeModeDefault);
  const [spinStyle, setSpinStyle] = useState<SpinStyle>(spinStyleDefault);

  const winnerCount = state.winnerCount ?? initialValues.winnerCount ?? 3;
  const winnerPercent =
    state.winnerPercent ?? initialValues.winnerPercent ?? 10;
  const prizeText = state.prizeText ?? initialValues.prizeText ?? '';
  const prizeList = state.prizeList ?? initialValues.prizeList ?? '';

  return (
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
          defaultValue={state.name ?? initialValues.name ?? ''}
          placeholder="Friday night giveaway"
          className="field-input"
        />
      </div>

      {showSlugField && (
        <SlugField defaultValue={state.slug ?? initialValues.slug ?? ''} />
      )}

      <fieldset className="mb-8">
        <legend className="field-label">Brand colors</legend>
        <div className="grid grid-cols-2 gap-3">
          <ColorField
            id="primaryColor"
            label="Primary"
            defaultValue={
              state.primaryColor ?? initialValues.primaryColor ?? '#E10A0A'
            }
          />
          <ColorField
            id="accentColor"
            label="Accent"
            defaultValue={
              state.accentColor ?? initialValues.accentColor ?? '#0050FF'
            }
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
            defaultValue={winnerCount}
            min={1}
            max={1000}
          />
        ) : (
          <NumberField
            id="winnerPercent"
            label="Percent of entries"
            defaultValue={winnerPercent}
            min={1}
            max={100}
            suffix="%"
          />
        )}
        {winnerMode === 'count' ? (
          <input type="hidden" name="winnerPercent" value={winnerPercent} />
        ) : (
          <input type="hidden" name="winnerCount" value={winnerCount} />
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
            defaultValue={prizeText}
            placeholder="A bottle of something good"
            className="field-input"
          />
        ) : (
          <textarea
            id="prizeList"
            name="prizeList"
            rows={5}
            defaultValue={prizeList}
            placeholder="One prize per line, in draw order:&#10;1st — weekend trip&#10;2nd — dinner for two&#10;3rd — bar tab"
            className="field-input resize-y"
          />
        )}
        {prizeMode === 'same' ? (
          <input type="hidden" name="prizeList" value={prizeList} />
        ) : (
          <input type="hidden" name="prizeText" value={prizeText} />
        )}
      </fieldset>

      <fieldset className="mb-10">
        <legend className="field-label">Draw animation</legend>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          <RadioCard
            name="spinStyle"
            value="wheel"
            label="Wheel"
            hint="Classic wheel of names"
            checked={spinStyle === 'wheel'}
            onChange={() => setSpinStyle('wheel')}
          />
        </div>
      </fieldset>

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

function SlugField({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);

  // Live sanitisation: lowercase, replace runs of non-slug chars with a single
  // hyphen, strip leading/trailing hyphens. Mirror the server's slugify() so
  // the preview matches what gets stored.
  function sanitise(input: string) {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+/, '')
      .slice(0, 40);
  }

  return (
    <div className="mb-6">
      <label htmlFor="slug" className="field-label">
        URL slug <span className="text-mist normal-case">(optional)</span>
      </label>
      <input
        id="slug"
        name="slug"
        type="text"
        maxLength={40}
        value={value}
        onChange={(e) => setValue(sanitise(e.target.value))}
        placeholder="friday-night"
        className="field-input font-mono text-sm"
      />
      <p className="mt-2 text-xs text-mist">
        {value
          ? `Share link will be /r/${value}`
          : 'Leave blank to generate one from the name. 4–40 lowercase letters, digits, and hyphens.'}
      </p>
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
