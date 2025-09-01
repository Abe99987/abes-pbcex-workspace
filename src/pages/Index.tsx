import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AssetPricing from "@/components/AssetPricing";
import FeaturesSection from "@/components/FeaturesSection";
import EducationSection from "@/components/EducationSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>PBCex - Asset-Backed Digital Banking | Precious Metals Trading</title>
        <meta name="description" content="Trade gold, silver, and commodities with PBCex. A bank for the people backed by real assets with full regulatory compliance and bank-grade security." />
        <meta property="og:title" content="PBCex - Asset-Backed Digital Banking" />
        <meta property="og:description" content="Trade precious metals and commodities with full regulatory compliance. Secure, transparent, and innovative digital banking backed by real assets." />
        <link rel="canonical" href="https://pbcex.com/" />
      </Helmet>
      <Navigation />
      <HeroSection />
      <AssetPricing />
      <FeaturesSection />
      <EducationSection />
      <Footer />
    </div>
  );
};

export default Index;
