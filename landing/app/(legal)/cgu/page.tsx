import type { Metadata } from 'next';
import { Footer } from '@/components/sections/footer';

export const metadata: Metadata = {
  title: 'CGU',
  description: 'Conditions générales d’utilisation de DeckPad.',
};

export default function Page() {
  return (
    <>
      <main id="main" className="pt-32 pb-24">
        <article className="container-prose">
          <h1 className="text-h2 mb-8">Conditions générales d’utilisation</h1>
          <div className="space-y-5 text-[15px] leading-relaxed text-[var(--color-platinum-300)]">
            <p>
              DeckPad est distribué sous licence MIT. L’utilisation du logiciel implique
              l’acceptation de cette licence, dont le texte intégral accompagne chaque
              version publiée.
            </p>
            <p>
              Le logiciel est fourni « tel quel », sans garantie d’aucune sorte. L’auteur
              ne peut être tenu responsable des dommages directs ou indirects résultant
              de son usage.
            </p>
            <p>
              En t’inscrivant à la liste d’accès anticipé, tu acceptes de recevoir un
              unique email de notification au moment du lancement officiel.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
