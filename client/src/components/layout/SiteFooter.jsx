import { Link } from "react-router-dom";
import { siteFooter } from "../../data/homeData";

// Forest-green editorial footer, shared across chromed pages.
export default function SiteFooter() {
  return (
    <footer className="bg-primary-container text-on-primary-container border-t border-hairline py-section-gap px-grid-margin">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-stack-lg">
        <div>
          <Link
            to="/"
            className="font-display-hero font-black text-headline-section text-surface-bone lowercase mb-6 block"
          >
            boma<span className="text-secondary-container">.</span>
          </Link>
          <p className="opacity-60 max-w-xs font-body-main mb-8">
            {siteFooter.tagline}
          </p>
          <div className="flex gap-4">
            {["share", "public"].map((icon) => (
              <span
                key={icon}
                className="w-8 h-8 rounded-circle border border-hairline flex items-center justify-center opacity-60"
              >
                <span className="material-symbols-outlined text-lg">
                  {icon}
                </span>
              </span>
            ))}
          </div>
        </div>

        {siteFooter.columns.map((column) => (
          <div key={column.heading} className="space-y-4">
            <span className="font-label-eyebrow text-[10px] uppercase tracking-widest text-secondary-container">
              {column.heading}
            </span>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="font-body-main opacity-80 hover:opacity-100 hover:text-secondary-container transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-hairline flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 font-label-eyebrow text-[10px]">
        <span>{siteFooter.legal.copyright}</span>
        <div className="flex gap-8">
          {siteFooter.legal.notes.map((note) => (
            <span key={note}>{note}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
