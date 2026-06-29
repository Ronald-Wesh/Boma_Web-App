import { Link } from "react-router-dom";
import { differentiators } from "../../data/homeData";

// Three-column ruled grid of the product's pillars. Each cell links to
// the relevant feature area.
export default function Differentiators() {
  return (
    <section className="max-w-7xl mx-auto py-section-gap px-grid-margin">
      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-hairline">
        {differentiators.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="group p-12 border-r border-b border-hairline hover:bg-surface-bone transition-colors duration-500"
          >
            <span className="material-symbols-outlined text-primary text-4xl mb-6 block group-hover:scale-110 transition-transform">
              {item.icon}
            </span>
            <h3 className="font-headline-section text-headline-section text-primary lowercase mb-4">
              {item.title}
            </h3>
            <p className="text-on-surface-variant font-body-main">{item.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
