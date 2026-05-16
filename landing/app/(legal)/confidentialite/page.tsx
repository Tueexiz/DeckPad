import type { Metadata } from 'next';
import { Footer } from '@/components/sections/footer';

export const metadata: Metadata = {
  title: 'Confidentialité',
  description: 'Politique de confidentialité de DeckPad.',
};

export default function Page() {
  return (
    <>
      <main id="main" className="pt-32 pb-24">
        <article className="container-prose">
          <h1 className="text-h2 mb-8">Confidentialité</h1>
          <div className="space-y-5 text-[15px] leading-relaxed text-[var(--color-platinum-300)]">
            <p>
              DeckPad ne collecte aucune donnée personnelle via l’application : tout
              transite par ton réseau local. Aucune télémétrie n’est envoyée vers
              Internet.
            </p>
            <p>
              Le site marketing utilise Vercel Analytics, qui agrège des mesures
              anonymisées sans cookie ni identifiant individuel.
            </p>
            <p>
              Lors de l’inscription à la liste d’accès anticipé, ton adresse email est
              transmise au service Resend afin de te notifier au lancement. Elle n’est
              jamais partagée ni revendue.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
