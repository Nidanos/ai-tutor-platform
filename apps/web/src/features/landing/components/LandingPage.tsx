import { Poppins } from "next/font/google";
import LandingNavbar from "./LandingNavbar";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";

// Built into the site at build time, so visitors' browsers never contact Google.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

function LandingPage() {
  return (
    <main className={`landing-grid relative min-h-screen overflow-hidden ${poppins.className}`}>
      <LandingNavbar />

      <HeroSection />
      
      <FeaturesSection />
    </main>
  );
}

export default LandingPage;