import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Jost, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { defaultMetadata, buildSoftwareJsonLd } from '@/lib/seo';
import { fr } from '@/lib/copy/fr';
import { AppShell } from '@/components/shared/app-shell';
import './globals.css';

const fontDisplay = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-bodoni',
  display: 'swap',
});

const fontSans = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono-jb',
  display: 'swap',
});

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: '#07060e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = buildSoftwareJsonLd();

  return (
    <html
      lang="fr"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a href="#main" className="skip-link">
          {fr.nav.skip}
        </a>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Toaster
            position="bottom-right"
            theme="dark"
            duration={4500}
            toastOptions={{
              style: {
                background: 'var(--color-bg-elev-2)',
                color: 'var(--color-platinum-100)',
                border: '1px solid var(--color-hairline-strong)',
              },
            }}
          />
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Analytics />
      </body>
    </html>
  );
}
