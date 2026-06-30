import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { roommateAPI, campusAPI } from "../Utils/api";
import { useAuth } from "../hooks/useAuth";
import { initials } from "../components/roommates/roommateFormat";
import RoommateCard from "../components/roommates/RoommateCard";
import RoommateProfileModal from "../components/roommates/RoommateProfileModal";

const SKELETON_COUNT = 6;

// ─── Client-side compatibility breakdown ──────────────────────────────────
// The /matches endpoint returns a single overall score; we mirror its weights
// here to render the budget / lifestyle / timing sub-meters in the design.
const budgetPct = (me, other) => {
  const low = Math.max(me.budgetMin || 0, other.budgetMin || 0);
  const high = Math.min(me.budgetMax || 0, other.budgetMax || 0);
  if (high < low) return 0;
  const union =
    Math.max(me.budgetMax || 0, other.budgetMax || 0) -
    Math.min(me.budgetMin || 0, other.budgetMin || 0);
  return union > 0 ? Math.round(((high - low) / union) * 100) : 100;
};

const lifestylePct = (me, other) => {
  const a = me.lifestyle || {};
  const b = other.lifestyle || {};
  const total = 12 + 12 + 10 + 6 + 6 + 4;
  let score = 0;
  if (a.sleepSchedule === b.sleepSchedule) score += 12;
  if (a.cleanliness === b.cleanliness) score += 12;
  if (a.studyHabits === b.studyHabits) score += 10;
  if (a.guests === b.guests) score += 6;
  if (a.smoking === b.smoking) score += 6;
  if (a.pets === b.pets) score += 4;
  return Math.round((score / total) * 100);
};

const timingPct = (me, other) => {
  if (!me.moveInDate || !other.moveInDate) return 0;
  const days =
    Math.abs(new Date(me.moveInDate) - new Date(other.moveInDate)) / 86400000;
  return Math.round(Math.max(0, Math.min(100, 100 - days / 0.6)));
};

const buildBreakdown = (me, other) =>
  me
    ? {
        budget: budgetPct(me, other),
        lifestyle: lifestylePct(me, other),
        timing: timingPct(me, other),
      }
    : null;

// Profile completeness for the summary meter: 3 required fields are always
// present (campus, budget, gender); bio + move-in date are the bonus signals.
const completeness = (profile) => {
  if (!profile) return 0;
  let filled = 3;
  if (profile.moveInDate) filled += 1;
  if (profile.bio?.trim()) filled += 1;
  return Math.round((filled / 5) * 100);
};

// Eyebrow label that heads each feed section.
function SectionLabel({ children }) {
  return (
    <div className="mb-stack-lg">
      <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase">
        {children}
      </span>
    </div>
  );
}

// Ruled grid of roommate cards.
function CardGrid({ entries, onConnect, onView }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border border-hairline">
      {entries.map(({ profile, compatibility, breakdown }) => (
        <RoommateCard
          key={profile._id}
          profile={profile}
          compatibility={compatibility}
          breakdown={breakdown}
          onConnect={onConnect}
          onView={onView}
        />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, body, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center border border-hairline ${
        compact ? "py-12" : "py-section-gap min-h-[40vh]"
      }`}
    >
      <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
        {icon}
      </span>
      <h3 className="font-headline-section text-2xl text-primary lowercase mb-2">
        {title}
      </h3>
      <p className="font-body-main text-on-surface-variant max-w-sm">{body}</p>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border border-hairline">
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <div key={index} className="bg-surface p-stack-lg">
          <div className="flex items-center gap-stack-md mb-stack-md">
            <div className="w-14 h-14 rounded-full bg-surface-container animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-surface-container animate-pulse" />
              <div className="h-3 w-16 bg-surface-container animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 mb-stack-md">
            <div className="h-2 w-full bg-surface-container animate-pulse" />
            <div className="h-2 w-full bg-surface-container animate-pulse" />
            <div className="h-2 w-2/3 bg-surface-container animate-pulse" />
          </div>
          <div className="h-10 w-full bg-surface-container animate-pulse rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function Roommates() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [campuses, setCampuses] = useState([]);
  const [campusFilter, setCampusFilter] = useState("");

  const [myProfile, setMyProfile] = useState(null);
  // Each entry: { profile, compatibility, breakdown }. matchEntries are the
  // ranked, hard-filtered matches; moreEntries is the wider pool to explore.
  const [matchEntries, setMatchEntries] = useState([]);
  const [moreEntries, setMoreEntries] = useState([]);
  // "matches" once the user has a profile; "browse" otherwise (incl. logged out)
  const [mode, setMode] = useState("browse");
  const [loading, setLoading] = useState(true);
  const [viewEntry, setViewEntry] = useState(null);

  // Campus list for the browse filter.
  useEffect(() => {
    campusAPI
      .getAllCampuses()
      .then((res) => setCampuses(res.data || []))
      .catch(() => setCampuses([]));
  }, []);

  // Public browse feed (logged out, or logged in without a profile).
  const loadBrowse = useCallback(async (campus) => {
    const params = {};
    if (campus) params.campus = campus;
    const { data } = await roommateAPI.browseProfiles(params);
    setMoreEntries(
      (data || []).map((profile) => ({
        profile,
        compatibility: null,
        breakdown: null,
      })),
    );
  }, []);

  // Top-level load: prefer the ranked matches feed for users with a profile,
  // otherwise fall back to public browse.
  const load = useCallback(async () => {
    setLoading(true);
    setMatchEntries([]);
    setMoreEntries([]);
    try {
      if (!isAuthenticated) {
        setMode("browse");
        setMyProfile(null);
        await loadBrowse(campusFilter);
        return;
      }

      const me = await roommateAPI
        .getMyProfile()
        .then((res) => res.data)
        .catch(() => null);
      setMyProfile(me);

      if (!me) {
        // Logged in but no profile yet → browse + prompt to create one.
        setMode("browse");
        await loadBrowse(campusFilter);
        return;
      }

      const { data } = await roommateAPI.getMatches();
      setMode("matches");
      setMatchEntries(
        (data.matches || []).map(({ profile, compatibility }) => ({
          profile,
          compatibility,
          breakdown: buildBreakdown(me, profile),
        })),
      );
      // Also populate the broader "explore more" pool below the ranked section.
      await loadBrowse(campusFilter);
    } catch (error) {
      console.error("Failed to load roommates", error);
      toast.error(
        error.response?.data?.message || "Failed to load roommate matches",
      );
      setMatchEntries([]);
      setMoreEntries([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, campusFilter, loadBrowse]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = (profile) => {
    if (!isAuthenticated) {
      toast.error("Sign in to connect with roommates");
      navigate("/login");
      return;
    }
    toast.success(
      `We've let ${profile?.user?.name?.split(" ")[0] || "them"} know you're interested`,
    );
  };

  const headingCampus =
    mode === "matches"
      ? myProfile?.campus?.shortName || myProfile?.campus?.name
      : campuses.find((c) => c._id === campusFilter)?.shortName;

  const heading =
    mode === "matches"
      ? `top matches${headingCampus ? ` near ${headingCampus.toLowerCase()}` : ""}`
      : `students looking${headingCampus ? ` near ${headingCampus.toLowerCase()}` : " for roommates"}`;

  return (
    <div>
      {/* Header */}
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-screen-2xl mx-auto px-grid-margin">
          <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase">
            roommate matching
          </span>
          <h1 className="font-display-hero text-display-hero-mobile md:text-display-hero text-primary lowercase max-w-4xl mt-stack-sm mb-stack-md">
            find your people, before your place.
          </h1>
          <p className="font-body-main text-body-main text-slate-muted max-w-2xl">
            we match you on budget, lifestyle and move-in timing — not just who
            replied first.
          </p>
        </div>
      </header>

      {/* Summary + filters bar */}
      <section className="w-full border-b border-hairline bg-surface sticky top-16 z-40">
        <div className="max-w-screen-2xl mx-auto px-grid-margin min-h-20 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left: who's matching */}
          {mode === "matches" && myProfile ? (
            <div className="flex items-center gap-stack-md w-full md:w-auto">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container border border-hairline flex items-center justify-center shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "You"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-body-strong text-slate-muted">
                    {initials(user?.name)}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-body-strong text-primary lowercase">
                    {user?.name?.split(" ")[0]?.toLowerCase() || "you"}
                  </span>
                  <span className="font-label-eyebrow text-[10px] text-slate-muted uppercase">
                    {myProfile.campus?.shortName || "your campus"}
                  </span>
                </div>
                <div className="flex items-center gap-3 w-48">
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary-container"
                      style={{ width: `${completeness(myProfile)}%` }}
                    />
                  </div>
                  <span className="font-label-eyebrow text-[10px] text-secondary-container whitespace-nowrap">
                    {completeness(myProfile)}% complete
                  </span>
                </div>
              </div>
              <Link
                to="/roommates/profile"
                className="ml-2 font-label-eyebrow text-[10px] text-slate-muted hover:text-primary transition-colors lowercase border border-hairline px-3 py-1 rounded-full"
              >
                edit profile
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-stack-md w-full md:w-auto">
              <span className="material-symbols-outlined text-secondary-container">
                {isAuthenticated ? "person_add" : "lock"}
              </span>
              <p className="font-body-main text-sm text-on-surface-variant">
                {isAuthenticated
                  ? "complete your profile to unlock ranked matches."
                  : "sign in and build a profile to get matched on compatibility."}
              </p>
              <Link
                to={isAuthenticated ? "/roommates/profile" : "/login"}
                className="font-label-eyebrow text-[10px] text-honey-ink bg-secondary-container px-3 py-1.5 rounded-full lowercase hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
              >
                {isAuthenticated ? "create profile" : "sign in"}
              </Link>
            </div>
          )}

          {/* Right: campus filter (browse mode only; matches are same-campus) */}
          {mode === "browse" && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="font-label-eyebrow text-[10px] text-slate-muted uppercase hidden md:block">
                campus
              </span>
              <select
                value={campusFilter}
                onChange={(event) => setCampusFilter(event.target.value)}
                className="bg-surface border border-hairline rounded-full font-label-eyebrow text-[10px] uppercase py-2 pl-3 pr-8 focus:ring-1 focus:ring-secondary-container outline-none cursor-pointer w-full md:w-auto"
              >
                <option value="">all campuses</option>
                {campuses.map((campus) => (
                  <option key={campus._id} value={campus._id}>
                    {campus.shortName || campus.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Feed */}
      <main className="w-full py-section-gap">
        <div className="max-w-screen-2xl mx-auto px-grid-margin">
          {loading ? (
            <FeedSkeleton />
          ) : mode === "matches" ? (
            matchEntries.length === 0 && moreEntries.length === 0 ? (
              <EmptyState
                icon="groups"
                title="no matches just yet"
                body="widen your budget or move-in window — new students join every week."
              />
            ) : (
              <div className="space-y-section-gap">
                {matchEntries.length > 0 && (
                  <div>
                    <SectionLabel>{heading}</SectionLabel>
                    <CardGrid
                      entries={matchEntries}
                      onConnect={handleConnect}
                      onView={(p, meta) =>
                        setViewEntry({ profile: p, compatibility: meta.compatibility })
                      }
                    />
                  </div>
                )}
                {moreEntries.length > 0 && (
                  <div>
                    <SectionLabel>explore more</SectionLabel>
                    <CardGrid
                      entries={moreEntries}
                      onConnect={handleConnect}
                      onView={(p, meta) =>
                        setViewEntry({ profile: p, compatibility: meta.compatibility })
                      }
                    />
                  </div>
                )}
              </div>
            )
          ) : (
            <>
              <div className="mb-stack-lg">
                <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase">
                  {heading}
                </span>
              </div>
              {moreEntries.length === 0 ? (
                <EmptyState
                  icon="groups"
                  title="no roommate seekers here yet"
                  body="be the first from your campus to start looking."
                />
              ) : (
                <CardGrid
                  entries={moreEntries}
                  onConnect={handleConnect}
                  onView={(p, meta) =>
                    setViewEntry({ profile: p, compatibility: meta.compatibility })
                  }
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* CTA band */}
      <section className="w-full bg-primary-container py-section-gap">
        <div className="max-w-screen-2xl mx-auto px-grid-margin flex flex-col md:flex-row justify-between items-center gap-stack-lg">
          <h2 className="font-display-hero-mobile text-display-hero-mobile text-on-primary lowercase max-w-xl">
            the right roommate makes the place.
          </h2>
          <Link
            to={isAuthenticated ? "/roommates/profile" : "/register"}
            className="bg-secondary-container text-honey-ink font-body-strong px-10 py-4 rounded-full lowercase hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
          >
            {myProfile ? "update your profile" : "complete your profile"}
          </Link>
        </div>
      </section>

      {viewEntry && (
        <RoommateProfileModal
          entry={viewEntry}
          onClose={() => setViewEntry(null)}
          onConnect={(profile) => {
            setViewEntry(null);
            handleConnect(profile);
          }}
        />
      )}
    </div>
  );
}
