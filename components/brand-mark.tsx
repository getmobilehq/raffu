import Link from 'next/link';

export function BrandMark({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3 no-underline text-shadow"
    >
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-shadow text-off-white font-heading font-black text-base">
        R
      </span>
      <span className="font-heading font-bold text-lg tracking-tight">
        Raffu
      </span>
    </Link>
  );
}
