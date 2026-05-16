import type { Metadata } from 'next';
import { Footer } from '@/components/sections/footer';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site DeckPad.',
};

export default function Page() {
  return (
    <>
      <main id="main" className="pt-32 pb-24">
        <article className="container-prose prose prose-invert">
          <h1 className="text-h2 mb-8">Mentions légales</h1>
          <p className="text-[15px] leading-relaxed text-[var(--color-platinum-300)]">
            Le site DeckPad est édité par un développeur indépendant à Paris.
            Hébergement : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
          </p>
          <p className="mt-6 text-[15px] leading-relaxed text-[var(--color-platinum-300)]">
            Pour toute question relative à l’édition du site, écris à{' '}
            <a
              className="underline-offset-4 hover:underline text-[var(--color-platinum-100)]"
              href="mailto:support@deckpad.app"
            >
              support@deckpad.app
            </a>
            .
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
