import { Link, useLocation } from "react-router-dom";

// Placeholder for editorial pages not built yet, so header/footer links
// never dead-end on a blank screen. Renders inside SiteLayout chrome.
export default function ComingSoon() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, "") || "this page";

  return (
    <section className="max-w-3xl mx-auto text-center px-grid-margin py-section-gap min-h-[60vh] flex flex-col justify-center">
      <span className="font-label-eyebrow text-label-eyebrow text-secondary-container uppercase tracking-[4px] mb-6 block">
        coming soon
      </span>
      <h1 className="font-display-hero text-display-hero-mobile md:text-headline-section text-primary lowercase mb-6">
        {slug} is on the way.
      </h1>
      <p className="font-body-main text-on-surface-variant max-w-md mx-auto mb-10">
        We're building this part of boma right now. In the meantime, explore
        verified listings near your campus.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link
          to="/listings"
          className="bg-secondary-container text-honey-ink px-8 py-3 rounded-full font-body-strong hover:brightness-110 active:scale-95 transition-all"
        >
          browse listings
        </Link>
        <Link
          to="/"
          className="font-body-strong text-primary border-b border-primary hover:text-secondary-container hover:border-secondary-container transition-all pb-1"
        >
          back home
        </Link>
      </div>
    </section>
  );
}
