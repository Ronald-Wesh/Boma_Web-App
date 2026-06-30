import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { roommateAPI, campusAPI } from "../Utils/api";
import { useAuth } from "../hooks/useAuth";

const INPUT_CLASS =
  "w-full bg-transparent border border-hairline rounded-lg px-4 py-3 " +
  "focus:outline-none focus:border-primary font-body-main text-body-main " +
  "text-primary placeholder:text-outline-variant transition-colors";
const LABEL_CLASS =
  "block font-label-eyebrow text-label-eyebrow text-slate-muted uppercase mb-2";

// Enum option sets mirror the RoommateProfile schema exactly.
const GENDER = [
  { value: "male", label: "male" },
  { value: "female", label: "female" },
  { value: "other", label: "other" },
];
const GENDER_PREF = [
  { value: "any", label: "anyone" },
  { value: "male", label: "male" },
  { value: "female", label: "female" },
];
const SLEEP = [
  { value: "early_bird", label: "early bird" },
  { value: "night_owl", label: "night owl" },
  { value: "flexible", label: "flexible" },
];
const CLEAN = [
  { value: "relaxed", label: "relaxed" },
  { value: "tidy", label: "tidy" },
  { value: "very_tidy", label: "very tidy" },
];
const STUDY = [
  { value: "quiet", label: "quiet" },
  { value: "social", label: "social" },
  { value: "flexible", label: "flexible" },
];
const GUESTS = [
  { value: "rarely", label: "rarely" },
  { value: "sometimes", label: "sometimes" },
  { value: "often", label: "often" },
];
const STATUS = [
  { value: "looking", label: "looking" },
  { value: "matched", label: "matched" },
  { value: "paused", label: "paused" },
];
const YES_NO = [
  { value: true, label: "yes" },
  { value: false, label: "no" },
];

const EMPTY_FORM = {
  campus: "",
  budgetMin: "",
  budgetMax: "",
  moveInDate: "",
  gender: "",
  genderPreference: "any",
  lifestyle: {
    sleepSchedule: "flexible",
    cleanliness: "tidy",
    smoking: false,
    pets: false,
    guests: "sometimes",
    studyHabits: "flexible",
  },
  bio: "",
  status: "looking",
};

// A pill-group selector for enum/boolean fields, in the editorial hairline style.
function Segmented({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-full font-body-strong text-sm lowercase border transition-all ${
              active
                ? "bg-secondary-container text-honey-ink border-secondary-container"
                : "border-hairline text-slate-muted hover:border-primary hover:text-primary"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      {children}
      {hint && (
        <p className="font-body-main text-xs text-slate-muted mt-2">{hint}</p>
      )}
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase whitespace-nowrap">
        {children}
      </span>
      <span className="flex-grow border-t border-hairline" />
    </div>
  );
}

export default function RoommateProfileEditor() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [campuses, setCampuses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Load campuses + any existing profile to prefill the form.
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    (async () => {
      setLoading(true);
      try {
        const [campusRes, me] = await Promise.all([
          campusAPI.getAllCampuses().catch(() => ({ data: [] })),
          roommateAPI
            .getMyProfile()
            .then((res) => res.data)
            .catch(() => null), // 404 = no profile yet
        ]);
        if (!active) return;

        setCampuses(campusRes.data || []);
        if (me) {
          setHasProfile(true);
          setForm({
            campus: me.campus?._id || me.campus || "",
            budgetMin: me.budgetMin ?? "",
            budgetMax: me.budgetMax ?? "",
            moveInDate: me.moveInDate ? me.moveInDate.slice(0, 10) : "",
            gender: me.gender || "",
            genderPreference: me.genderPreference || "any",
            lifestyle: { ...EMPTY_FORM.lifestyle, ...(me.lifestyle || {}) },
            bio: me.bio || "",
            status: me.status || "looking",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setLife = (key, value) =>
    setForm((f) => ({ ...f, lifestyle: { ...f.lifestyle, [key]: value } }));

  const bioLeft = 600 - form.bio.length;

  const validate = () => {
    if (!form.campus) return "Choose your campus.";
    if (!form.gender) return "Select your gender.";
    const max = Number(form.budgetMax);
    if (!max || max <= 0) return "Enter a maximum budget.";
    const min = Number(form.budgetMin) || 0;
    if (min > max) return "Minimum budget can't exceed the maximum.";
    if (form.bio.length > 600) return "Bio cannot exceed 600 characters.";
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      await roommateAPI.upsertMyProfile({
        campus: form.campus,
        budgetMin: Number(form.budgetMin) || 0,
        budgetMax: Number(form.budgetMax),
        moveInDate: form.moveInDate || undefined,
        gender: form.gender,
        genderPreference: form.genderPreference,
        lifestyle: form.lifestyle,
        bio: form.bio.trim(),
        status: form.status,
      });
      toast.success(
        hasProfile ? "Profile updated" : "Profile created — finding your matches",
      );
      navigate("/roommates");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save your profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await roommateAPI.deleteMyProfile();
      toast.success("Roommate profile removed");
      navigate("/roommates");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't remove your profile");
    } finally {
      setSubmitting(false);
    }
  };

  const campusOptions = useMemo(
    () =>
      campuses.map((c) => (
        <option key={c._id} value={c._id}>
          {c.name} {c.shortName ? `(${c.shortName})` : ""}
        </option>
      )),
    [campuses],
  );

  // Auth gate.
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="font-body-main text-on-surface-variant">
          checking session…
        </span>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div>
      {/* Header */}
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-3xl mx-auto px-grid-margin">
          <Link
            to="/roommates"
            className="inline-flex items-center gap-1 font-label-eyebrow text-[10px] text-slate-muted uppercase hover:text-primary transition-colors mb-stack-md"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            back to matches
          </Link>
          <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase block">
            roommate profile
          </span>
          <h1 className="font-display-hero text-display-hero-mobile text-primary lowercase mt-stack-sm mb-stack-md">
            tell us how you live.
          </h1>
          <p className="font-body-main text-body-main text-slate-muted max-w-xl">
            the more honest your profile, the better we can match you on budget,
            lifestyle and timing.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="max-w-3xl mx-auto px-grid-margin py-section-gap space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-surface-container animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto px-grid-margin py-section-gap"
        >
          {/* Basics */}
          <SectionHeading>the basics</SectionHeading>
          <div className="space-y-6 mb-section-gap">
            <Field label="campus">
              <select
                value={form.campus}
                onChange={(e) => set("campus", e.target.value)}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                <option value="">select your campus</option>
                {campusOptions}
              </select>
            </Field>
            <Field label="i am">
              <Segmented
                options={GENDER}
                value={form.gender}
                onChange={(v) => set("gender", v)}
              />
            </Field>
            <Field
              label="i'd like to room with"
              hint="we only match people whose preferences are mutual."
            >
              <Segmented
                options={GENDER_PREF}
                value={form.genderPreference}
                onChange={(v) => set("genderPreference", v)}
              />
            </Field>
          </div>

          {/* Budget & timing */}
          <SectionHeading>budget &amp; timing</SectionHeading>
          <div className="space-y-6 mb-section-gap">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="min budget / month">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-price-tabular text-slate-muted text-sm">
                    KSh
                  </span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.budgetMin}
                    onChange={(e) => set("budgetMin", e.target.value)}
                    placeholder="8000"
                    className={`${INPUT_CLASS} pl-14 font-price-tabular`}
                  />
                </div>
              </Field>
              <Field label="max budget / month">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-price-tabular text-slate-muted text-sm">
                    KSh
                  </span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.budgetMax}
                    onChange={(e) => set("budgetMax", e.target.value)}
                    placeholder="15000"
                    className={`${INPUT_CLASS} pl-14 font-price-tabular`}
                  />
                </div>
              </Field>
            </div>
            <Field label="ideal move-in date">
              <input
                type="date"
                value={form.moveInDate}
                onChange={(e) => set("moveInDate", e.target.value)}
                className={`${INPUT_CLASS} cursor-pointer`}
              />
            </Field>
          </div>

          {/* Lifestyle */}
          <SectionHeading>lifestyle</SectionHeading>
          <div className="space-y-6 mb-section-gap">
            <Field label="sleep schedule">
              <Segmented
                options={SLEEP}
                value={form.lifestyle.sleepSchedule}
                onChange={(v) => setLife("sleepSchedule", v)}
              />
            </Field>
            <Field label="cleanliness">
              <Segmented
                options={CLEAN}
                value={form.lifestyle.cleanliness}
                onChange={(v) => setLife("cleanliness", v)}
              />
            </Field>
            <Field label="study habits">
              <Segmented
                options={STUDY}
                value={form.lifestyle.studyHabits}
                onChange={(v) => setLife("studyHabits", v)}
              />
            </Field>
            <Field label="how often guests visit">
              <Segmented
                options={GUESTS}
                value={form.lifestyle.guests}
                onChange={(v) => setLife("guests", v)}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="smoker">
                <Segmented
                  options={YES_NO}
                  value={form.lifestyle.smoking}
                  onChange={(v) => setLife("smoking", v)}
                />
              </Field>
              <Field label="pet friendly">
                <Segmented
                  options={YES_NO}
                  value={form.lifestyle.pets}
                  onChange={(v) => setLife("pets", v)}
                />
              </Field>
            </div>
          </div>

          {/* About */}
          <SectionHeading>about you</SectionHeading>
          <div className="space-y-6 mb-section-gap">
            <Field label="bio" hint={`${bioLeft} characters left`}>
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value.slice(0, 600))}
                rows={4}
                placeholder="tell potential roommates a little about your routine, what you study, and what you're looking for in a place."
                className={`${INPUT_CLASS} resize-none`}
              />
            </Field>
            <Field
              label="status"
              hint="paused or matched profiles are hidden from the matches feed."
            >
              <Segmented
                options={STATUS}
                value={form.status}
                onChange={(v) => set("status", v)}
              />
            </Field>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-stack-md border-t border-hairline">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-secondary-container text-honey-ink font-body-strong px-10 py-3 rounded-full lowercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? "saving…"
                : hasProfile
                  ? "save changes"
                  : "create profile"}
            </button>
            <Link
              to="/roommates"
              className="w-full sm:w-auto text-center font-body-strong text-slate-muted lowercase hover:text-primary transition-colors px-4 py-3"
            >
              cancel
            </Link>

            {hasProfile && (
              <div className="sm:ml-auto">
                {confirmingDelete ? (
                  <div className="flex items-center gap-3">
                    <span className="font-body-main text-sm text-slate-muted lowercase">
                      remove profile?
                    </span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={submitting}
                      className="font-body-strong text-sm text-rose-danger lowercase hover:underline disabled:opacity-60"
                    >
                      yes, delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="font-body-strong text-sm text-slate-muted lowercase hover:text-primary"
                    >
                      no
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="font-label-eyebrow text-[10px] text-slate-muted uppercase hover:text-rose-danger transition-colors"
                  >
                    delete profile
                  </button>
                )}
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
