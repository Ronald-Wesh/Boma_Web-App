import { Link, useLocation, useSearchParams } from "react-router-dom";

// List | Map segmented control. Carries the current filter query string across
// so the two views stay in sync and links are shareable. `active` is "list" or
// "map" (falls back to the current path when omitted).
export default function MapToggle({ active }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : "";

  const current =
    active || (location.pathname.startsWith("/map") ? "map" : "list");

  const base = "px-4 py-1 text-sm rounded-md transition-colors";
  const on = "font-body-strong bg-surface-container-lowest shadow-sm text-primary";
  const off = "font-body-main text-slate-muted hover:text-primary";

  return (
    <div className="bg-surface-container p-1 rounded-lg flex">
      <Link
        to={`/listings${suffix}`}
        className={`${base} ${current === "list" ? on : off}`}
      >
        List
      </Link>
      <Link
        to={`/map${suffix}`}
        className={`${base} ${current === "map" ? on : off}`}
      >
        Map
      </Link>
    </div>
  );
}
