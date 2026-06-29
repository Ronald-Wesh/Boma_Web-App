import Hero from "../components/home/Hero";
import Differentiators from "../components/home/Differentiators";
import FeaturedListings from "../components/home/FeaturedListings";
import CtaBand from "../components/home/CtaBand";

// Public landing page (Boma Editorial). Header + footer come from SiteLayout.
export default function Home() {
  return (
    <>
      <Hero />
      <Differentiators />
      <FeaturedListings />
      <CtaBand />
    </>
  );
}
