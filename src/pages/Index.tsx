import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AssetPricing from "@/components/AssetPricing";
import FeaturesSection from "@/components/FeaturesSection";
import EducationSection from "@/components/EducationSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
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
