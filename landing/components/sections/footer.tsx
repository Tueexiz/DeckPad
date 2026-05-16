import { Logo } from '@/components/shared/logo';
import { fr } from '@/lib/copy/fr';

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-hairline)] bg-[var(--color-bg-base)]">
      <div className="container-tight py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_3fr] lg:gap-16">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-[var(--color-platinum-400)]">
              DeckPad transforme ta tablette Android en télécommande de précision pour
              Windows. Latence sous 30 ms. Gratuit, sans compte, 100 % local.
            </p>
          </div>

          <nav aria-label="Liens du pied de page">
            <ul className="grid grid-cols-2 gap-10 md:grid-cols-4">
              {fr.footer.columns.map((col) => (
                <li key={col.title}>
                  <h3 className="text-eyebrow mb-5" style={{ letterSpacing: '0.16em' }}>
                    {col.title}
                  </h3>
                  <ul className="space-y-3 text-[14px]">
                    {col.items.map((item) => (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          className="text-[var(--color-platinum-300)] transition-colors hover:text-[var(--color-platinum-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-[var(--color-hairline)] pt-8 sm:flex-row sm:items-center">
          <p className="text-[13px] text-[var(--color-platinum-500)]">
            {fr.footer.legal}
          </p>
          <p className="text-mono text-[12px] uppercase tracking-[0.2em] text-[var(--color-platinum-600)]">
            {fr.footer.version}
          </p>
        </div>
      </div>
    </footer>
  );
}
