import { Navbar } from '@/components/home/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { PlatformFeatures } from '@/components/home/PlatformFeatures';
import { TransferPlannerSection } from '@/components/home/TransferPlannerSection';
import { HowItWorksStrip } from '@/components/home/HowItWorksStrip';
import { CoursePlanningSection } from '@/components/home/CoursePlanningSection';
import { ScholarshipSection } from '@/components/home/ScholarshipSection';
import { ApplicationsSection } from '@/components/home/ApplicationsSection';
import { AffordabilitySection } from '@/components/home/AffordabilitySection';
import { ConnectedPlatformSection } from '@/components/home/ConnectedPlatformSection';
import { StateSupportSection } from '@/components/home/StateSupportSection';
import { BeforeAfterSection } from '@/components/home/BeforeAfterSection';
import { PricingSection } from '@/components/home/PricingSection';
import { FAQSection } from '@/components/home/FAQSection';
import { FinalCTA } from '@/components/home/FinalCTA';
import { HomeFooter } from '@/components/home/HomeFooter';

const HomePage = () => (
  <div className="bg-white text-ink [scroll-behavior:smooth]">
    <Navbar />
    <main>
      <HeroSection />
      <PlatformFeatures />
      <TransferPlannerSection />
      <HowItWorksStrip />
      <CoursePlanningSection />
      <ScholarshipSection />
      <ApplicationsSection />
      <AffordabilitySection />
      <ConnectedPlatformSection />
      <StateSupportSection />
      <BeforeAfterSection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
    </main>
    <HomeFooter />
  </div>
);

export default HomePage;
