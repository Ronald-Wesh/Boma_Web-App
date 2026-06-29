import { Link } from "react-router-dom";
import { featured } from "../../data/homeData";
import EditorialListingCard from "./EditorialListingCard";

// "Editor's Picks" strip on the cream surface. Static design content for
// now; the live /api/listings wiring lands with the Browse Listings page.
export default function FeaturedListings() {
  return (
    <section className="bg-surface-bone py-section-gap">
      <div className="max-w-7xl mx-auto px-grid-margin">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="font-label-eyebrow text-label-eyebrow text-on-primary-container uppercase tracking-[2px] block mb-2">
              {featured.eyebrow}
            </span>
            <h2 className="font-headline-section text-display-hero-mobile md:text-headline-section text-primary lowercase">
              {featured.heading}
            </h2>
          </div>
          <Link
            to={featured.link.to}
            className="font-body-strong text-primary border-b border-primary hover:text-secondary-container hover:border-secondary-container transition-all pb-1"
          >
            {featured.link.label}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-lg">
          {featured.listings.map((listing) => (
            <EditorialListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
