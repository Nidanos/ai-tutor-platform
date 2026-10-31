import LandingNavbar from "./navigation/LandingNavbar";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";

function LandingPage() {
  return (
    <main className="landing-grid relative min-h-screen overflow-hidden">
      <LandingNavbar />

      <HeroSection />
      
      <FeaturesSection />
    </main>
  );
}

export default LandingPage;