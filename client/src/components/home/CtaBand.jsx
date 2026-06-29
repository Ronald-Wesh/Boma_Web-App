import { Link } from "react-router-dom";
import { ctaBand } from "../../data/homeData";

// Closing forest call-to-action band.
export default function CtaBand() {
  return (
    <section className="bg-primary-container py-24 text-center">
      <div className="max-w-2xl mx-auto px-grid-margin">
        <h2 className="font-display-hero text-headline-section md:text-5xl text-surface-bone lowercase mb-10 leading-tight">
          {ctaBand.heading}
        </h2>
        <Link
          to={ctaBand.to}
          className="inline-block bg-secondary-container text-honey-ink px-12 py-4 rounded-full font-body-strong text-lg hover:scale-105 active:scale-95 transition-all"
        >
          {ctaBand.cta}
        </Link>
      </div>
    </section>
  );
}
