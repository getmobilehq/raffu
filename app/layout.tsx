import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Raffu — Raffle night, with grace',
  description:
    'Run beautiful, transparent raffles. Scan-to-enter, live winners, bold reveals. Free 30-day trial.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://raffu.xyz'),
  openGraph: {
    title: 'Raffu — Raffle night, with grace',
    description: 'Run beautiful, transparent raffles.',
    url: 'https://raffu.xyz',
    siteName: 'Raffu',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raffu — Raffle night, with grace',
    description: 'Run beautiful, transparent raffles.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
