import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deckpad.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/mentions-legales`, lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/confidentialite`, lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/cgu`, lastModified: now, priority: 0.3 },
  ];
}
