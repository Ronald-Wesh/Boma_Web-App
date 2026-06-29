import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { heroContent } from "../../data/homeData";

// Forest hero with the display headline, a campus search bar, and stat row.
export default function Hero() {
  const navigate = useNavigate();
  const [campus, setCampus] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();
    const query = campus.trim();
    navigate(query ? `/listings?campus=${encodeURIComponent(query)}` : "/listings");
  };

  return (
    <header className="bg-primary-container relative overflow-hidden flex flex-col items-center justify-center text-center py-24 md:py-32 px-grid-margin">
      <div className="z-10 max-w-4xl">
        <span className="font-label-eyebrow text-label-eyebrow text-secondary-container mb-6 block uppercase tracking-[4px]">
          {heroContent.eyebrow}
        </span>
        <h1 className="font-display-hero text-display-hero-mobile md:text-display-hero text-surface-bone lowercase mb-12">
          {heroContent.titleLines[0]}
          <br />
          {heroContent.titleLines[1]}
        </h1>

        <form
          onSubmit={handleSearch}
          className="bg-surface-bone p-2 rounded-full flex flex-col md:flex-row items-center gap-2 max-w-2xl mx-auto border border-hairline"
        >
          <div className="flex items-center px-6 py-2 flex-1 w-full">
            <span className="material-symbols-outlined mr-3 text-primary opacity-50">
              location_on
            </span>
            <input
              type="text"
              value={campus}
              onChange={(event) => setCampus(event.target.value)}
              placeholder={heroContent.searchPlaceholder}
              aria-label="Search by campus"
              className="bg-transparent border-none focus:outline-none w-full text-primary font-body-main placeholder:text-outline-variant"
            />
          </div>
          <button
            type="submit"
            className="bg-primary-container text-surface-bone px-8 py-3 rounded-full font-body-strong w-full md:w-auto hover:bg-primary transition-all"
          >
            {heroContent.searchCta}
          </button>
        </form>

        <div className="mt-12 flex justify-center gap-12 text-surface-bone/60 font-label-eyebrow text-[10px] uppercase tracking-widest">
          {heroContent.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <span className="text-surface-bone text-lg font-price-tabular">
                {stat.value}
              </span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary-container to-transparent opacity-50 pointer-events-none" />
    </header>
  );
}
