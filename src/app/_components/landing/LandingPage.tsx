'use client';

import Navbar from './Navbar';
import HeroSection from './HeroSection';
import TrustedBySection from './TrustedBySection';
import FeaturesSection from './FeaturesSection';
import ComparisonSection from './ComparisonSection';
import HowItWorksSection from './HowItWorksSection';
import DashboardPreviewSection from './DashboardPreviewSection';
import MetricsSection from './MetricsSection';
import TestimonialsSection from './TestimonialsSection';
import IntegrationsSection from './IntegrationsSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';
import FooterSection from './FooterSection';
import ScrollToTop from './ScrollToTop';

export default function LandingPage() {
    return (
        <div style={{ overflowX: 'hidden' }}>
            <Navbar />
            <main>
                <HeroSection />
                <TrustedBySection />
                <FeaturesSection />
                <ComparisonSection />
                <HowItWorksSection />
                <DashboardPreviewSection />
                <MetricsSection />
                <TestimonialsSection />
                <IntegrationsSection />
                <FAQSection />
                <CTASection />
            </main>
            <FooterSection />
            <ScrollToTop />
        </div>
    );
}
