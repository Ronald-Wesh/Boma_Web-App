import {
  lifestyleTags,
  budgetLabel,
  moveLabel,
  initials,
} from "./roommateFormat";

// A small labelled progress meter used for the budget / lifestyle / timing
// compatibility breakdown on a match card.
function Meter({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-label-eyebrow text-[9px] text-slate-muted uppercase">
        {label}
      </span>
      <div className="h-1 bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full bg-secondary-container"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

// Avatar that shows the user's photo, falling back to their initials.
function Avatar({ user, size = "w-14 h-14" }) {
  return (
    <div
      className={`${size} rounded-full overflow-hidden border border-hairline bg-surface-container flex items-center justify-center shrink-0`}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name || "Roommate"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-body-strong text-slate-muted">
          {initials(user?.name)}
        </span>
      )}
    </div>
  );
}

// Editorial roommate card backed by a live RoommateProfile.
// `compatibility` (0-100) + `breakdown` are present in matches mode and absent
// in the public browse feed, where we show a status chip instead.
export default function RoommateCard({
  profile,
  compatibility = null,
  breakdown = null,
  onConnect,
  onView,
}) {
  const user = profile?.user || {};
  const campus = profile?.campus?.shortName || profile?.campus?.name || "";
  const tags = lifestyleTags(profile, 3);
  const isVerified = user?.verificationStatus === "verified";

  return (
    <div className="bg-surface p-stack-lg flex flex-col gap-stack-md transition-all duration-300 hover:bg-surface-bone hover:-translate-y-0.5">
      {/* Identity + match score */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-stack-md min-w-0">
          <Avatar user={user} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-body-strong text-primary lowercase truncate">
                {user?.name || "anonymous"}
              </h3>
              {isVerified && (
                <span
                  className="material-symbols-outlined text-emerald-verified text-base"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  title="verified student"
                >
                  verified
                </span>
              )}
            </div>
            <p className="font-label-eyebrow text-[10px] text-slate-muted uppercase truncate">
              {campus || "campus —"}
            </p>
          </div>
        </div>
        {compatibility != null ? (
          <span className="font-label-eyebrow text-secondary-container text-[12px] whitespace-nowrap">
            {compatibility}% MATCH
          </span>
        ) : (
          <span className="font-label-eyebrow text-[10px] text-emerald-verified uppercase whitespace-nowrap">
            looking
          </span>
        )}
      </div>

      {/* Compatibility breakdown (matches mode only) */}
      {breakdown && (
        <div className="space-y-2">
          <Meter label="budget" value={breakdown.budget} />
          <Meter label="lifestyle" value={breakdown.lifestyle} />
          <Meter label="timing" value={breakdown.timing} />
        </div>
      )}

      {/* Lifestyle chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 border border-hairline rounded-full font-label-eyebrow text-[10px] text-slate-muted lowercase"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Budget + move-in */}
      <div className="flex justify-between items-center border-y border-hairline py-2">
        <span className="font-price-tabular text-primary lowercase">
          {budgetLabel(profile)}
        </span>
        <span className="font-label-eyebrow text-[10px] text-slate-muted uppercase">
          {moveLabel(profile)}
        </span>
      </div>

      {/* Bio */}
      <p className="font-body-main text-sm text-slate-muted line-clamp-2 min-h-[2.5rem]">
        {profile?.bio || "no bio yet — connect to learn more."}
      </p>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <button
          type="button"
          onClick={() => onConnect?.(profile)}
          className="flex-1 bg-secondary-container text-honey-ink font-body-strong py-2.5 rounded-full lowercase hover:brightness-110 active:scale-95 transition-all"
        >
          connect
        </button>
        <button
          type="button"
          onClick={() => onView?.(profile, { compatibility, breakdown })}
          className="px-4 border border-hairline text-slate-muted font-body-strong rounded-full lowercase hover:bg-surface-container transition-all"
        >
          view
        </button>
      </div>
    </div>
  );
}
