import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { primaryNav } from "../../data/homeData";

// Slim editorial top bar shared across all chromed pages.
// Auth-aware: shows sign in / get started when logged out, and the
// user's name + log out when authenticated (replaces the old App.jsx nav).
export default function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (to) => location.pathname === to;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-surface sticky top-0 z-50 border-b border-hairline w-full h-16 flex justify-between items-center px-grid-margin">
      <div className="flex items-center gap-10">
        <Link
          to="/"
          className="font-display-hero font-black text-headline-section text-primary lowercase leading-none"
        >
          boma<span className="text-secondary-container">.</span>
        </Link>
        <div className="hidden md:flex gap-8">
          {primaryNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`font-body-main transition-colors ${
                isActive(item.to)
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-secondary-container"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Link
          to="/listings"
          aria-label="Search listings"
          className="material-symbols-outlined text-primary p-2 hover:text-secondary-container transition-colors"
        >
          search
        </Link>

        {isAuthenticated ? (
          <>
            <span className="hidden md:block font-body-strong text-primary">
              {user?.name || user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-secondary-container text-honey-ink px-6 py-2 rounded-full font-body-strong transition-all hover:brightness-110 active:scale-95"
            >
              log out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="hidden md:block text-on-surface-variant font-body-strong hover:text-primary transition-colors"
            >
              sign in
            </Link>
            <Link
              to="/register"
              className="bg-secondary-container text-honey-ink px-6 py-2 rounded-full font-body-strong transition-all hover:brightness-110 active:scale-95"
            >
              get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
