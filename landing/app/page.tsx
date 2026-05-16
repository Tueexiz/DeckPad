import { Hero } from '@/components/sections/hero';
import { BenefitsGrid } from '@/components/sections/benefits-grid';
import { PlatformTabs } from '@/components/interactive/platform-tabs';
import { LatencyPingDemo } from '@/components/interactive/latency-ping-demo';
import { SocialProof } from '@/components/sections/social-proof';
import { SavingsCalculator } from '@/components/interactive/savings-calculator';
import { CompatibilityBadge } from '@/components/interactive/compatibility-badge';
import { WaitlistFormLazy } from '@/components/interactive/waitlist-form-lazy';
import { Faq } from '@/components/sections/faq';
import { Footer } from '@/components/sections/footer';

export default function Page() {
  return (
    <>
      <main id="main">
        <Hero />
        <BenefitsGrid />
        <SocialProof />
        <PlatformTabs />
        <LatencyPingDemo />
        <SavingsCalculator />
        <CompatibilityBadge variant="card" />
        <WaitlistFormLazy />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
