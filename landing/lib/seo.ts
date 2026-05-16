import type { Metadata } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deckpad.vercel.app';

export const SITE = {
  name: 'DeckPad',
  url: SITE_URL,
  description:
    'DeckPad transforme ta tablette Android en télécommande de précision pour Windows. Latence sous 30 ms. Gratuit, sans compte, 100 % local.',
  locale: 'fr_FR',
  twitter: '@deckpad',
} as const;

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'DeckPad — Ton PC. Ta tablette. Un geste.',
    template: '%s · DeckPad',
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: 'DeckPad' }],
  generator: 'Next.js',
  keywords: [
    'DeckPad',
    'télécommande PC',
    'Stream Deck Android',
    'contrôle PC tablette',
    'Windows remote',
    'soundboard',
    'macropad',
    'open source',
  ],
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: false, email: false, address: false },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: 'DeckPad — Ton PC. Ta tablette. Un geste.',
    description: SITE.description,
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'DeckPad — Télécommande de précision pour Windows',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeckPad — Ton PC. Ta tablette. Un geste.',
    description: SITE.description,
    creator: SITE.twitter,
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon.svg',
  },
};

export function buildSoftwareJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DeckPad',
    operatingSystem: 'Windows 10, Windows 11, Android 9+',
    applicationCategory: 'UtilitiesApplication',
    description: SITE.description,
    url: SITE.url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    aggregateRating: undefined,
    publisher: {
      '@type': 'Organization',
      name: 'DeckPad',
      url: SITE.url,
    },
  };
}
