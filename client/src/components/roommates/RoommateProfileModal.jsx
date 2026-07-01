import { useEffect } from "react";
import {
  lifestyleTags,
  budgetLabel,
  moveLabel,
  initials,
} from "./roommateFormat";

// connectionStatus -> [button label, disabled?]
const CONNECT_BUTTON = {
  none: (name) => [`connect with ${name}`, false],
  pending_sent: () => ["request sent", true],
  pending_received: () => ["respond from the requests tab", true],
  accepted: () => ["connected ✓", true],
  declined: () => ["declined", true],
};

// Full-profile overlay opened from a card's "view" button. Read-only — surfaces
// the complete bio + every lifestyle signal, plus the same connect action.
export default function RoommateProfileModal({ entry, onClose, onConnect }) {
  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!entry) return null;

  const { profile, compatibility, connectionStatus = "none" } = entry;
  const user = profile?.user || {};
  const campus = profile?.campus?.name || profile?.campus?.shortName || "campus —";
  const isVerified = user?.verificationStatus === "verified";
  const tags = lifestyleTags(profile);
  const [connectLabel, connectDisabled] = CONNECT_BUTTON[connectionStatus](
    user?.name?.split(" ")[0]?.toLowerCase() || "them",
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-primary/40 backdrop-blur-sm p-0 md:p-grid-margin"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full md:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl border border-hairline"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-stack-lg border-b border-hairline">
          <div className="flex items-center gap-stack-md min-w-0">
            <div className="w-16 h-16 rounded-circle overflow-hidden border border-hairline bg-surface-container flex items-center justify-center shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "Roommate"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-headline-section text-slate-muted text-xl">
                  {initials(user?.name)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-headline-section text-2xl text-primary lowercase truncate">
                  {user?.name || "anonymous"}
                </h2>
                {isVerified && (
                  <span
                    className="material-symbols-outlined text-emerald-verified text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    title="verified student"
                  >
                    verified
                  </span>
                )}
              </div>
              <p className="font-label-eyebrow text-[10px] text-slate-muted uppercase">
                {campus}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="material-symbols-outlined text-slate-muted hover:text-primary transition-colors p-1"
          >
            close
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-hairline border-b border-hairline">
          {[
            { label: "budget", value: budgetLabel(profile) },
            { label: "move-in", value: moveLabel(profile).toLowerCase() },
            {
              label: "match",
              value: compatibility != null ? `${compatibility}%` : "—",
            },
          ].map((stat) => (
            <div key={stat.label} className="p-stack-md text-center">
              <p className="font-label-eyebrow text-[9px] text-slate-muted uppercase mb-1">
                {stat.label}
              </p>
              <p className="font-price-tabular text-primary text-sm lowercase">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="p-stack-lg space-y-stack-lg">
          <div>
            <p className="font-label-eyebrow text-[9px] text-slate-muted uppercase mb-2">
              about
            </p>
            <p className="font-body-main text-sm text-on-surface-variant leading-relaxed">
              {profile?.bio || "this student hasn't written a bio yet."}
            </p>
          </div>

          <div>
            <p className="font-label-eyebrow text-[9px] text-slate-muted uppercase mb-2">
              lifestyle
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 border border-hairline rounded-full font-label-eyebrow text-[10px] text-slate-muted lowercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="p-stack-lg border-t border-hairline">
          <button
            type="button"
            disabled={connectDisabled}
            onClick={() => onConnect?.(profile)}
            className="w-full bg-secondary-container text-honey-ink font-body-strong py-3 rounded-full lowercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100"
          >
            {connectLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
