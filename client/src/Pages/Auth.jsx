import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import authHero from "../assets/images/auth-hero.jpg";

// Mirror the backend validation (authController.js) so users never hit a
// server-side rejection they could have been warned about client-side.
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{8,}$/;

const isConfiguredGoogleClientId = (clientId) =>
  Boolean(clientId) &&
  !clientId.includes("your-google-web-client-id.apps.googleusercontent.com");

// Landlords manage listings, tenants browse them — send each to a different
// landing page post-auth instead of dumping everyone on the same Home page.
const landingPathForRole = (role) =>
  role === "landlord" ? "/landlord/dashboard" : "/";

const ROLE_OPTIONS = [
  {
    value: "tenant",
    icon: "person_search",
    label: "i'm looking for a place",
    sub: "student / tenant",
  },
  {
    value: "landlord",
    icon: "real_estate_agent",
    label: "i'm a landlord",
    sub: "list your property",
  },
];

const INPUT_CLASS =
  "w-full bg-transparent border border-hairline rounded-lg px-4 py-3 " +
  "focus:outline-none focus:border-primary font-body-main text-body-main " +
  "text-primary placeholder:text-outline-variant transition-colors";
const LABEL_CLASS =
  "block font-label-eyebrow text-label-eyebrow text-slate-muted uppercase mb-2";

function Wordmark({ className = "" }) {
  return (
    <span
      className={`font-display-hero font-black lowercase tracking-tighter text-primary ${className}`}
    >
      boma<span className="boma-period">.</span>
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, login, register, loginWithGoogle } =
    useAuth();

  const isRegister = location.pathname === "/register";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "tenant",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";
  const hasGoogleClientId = isConfiguredGoogleClientId(googleClientId);
  const [googleReady, setGoogleReady] = useState(
    typeof window !== "undefined" && Boolean(window.google?.accounts?.id),
  );

  // Reset transient UI when toggling between the two tabs.
  useEffect(() => {
    setShowPassword(false);
    setSubmitting(false);
  }, [isRegister]);

  // Wait for the Google Identity Services script (loaded in index.html).
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return undefined;
    }
    const poll = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        setGoogleReady(true);
        window.clearInterval(poll);
      }
    }, 250);
    return () => window.clearInterval(poll);
  }, []);

  const handleGoogleCredential = useCallback(
    async ({ credential }) => {
      const result = await loginWithGoogle({ credential });
      if (result.success) navigate(landingPathForRole(result.user?.role), { replace: true });
    },
    [loginWithGoogle, navigate],
  );

  // Initialize GIS once the script is ready and a client id is configured.
  useEffect(() => {
    if (!googleReady || !hasGoogleClientId) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    });
  }, [googleReady, hasGoogleClientId, googleClientId, handleGoogleCredential]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-bone px-5 py-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary-container" />
          <span className="font-body-main text-body-main text-on-surface-variant">
            checking session…
          </span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    if (!EMAIL_REGEX.test(form.email.trim()))
      return "Enter a valid email address.";
    if (!form.password) return "Password is required.";
    if (isRegister && form.name.trim().length < 2)
      return "Name must be at least 2 characters.";
    if (isRegister && !PASSWORD_REGEX.test(form.password))
      return "Password needs 8+ characters with uppercase, lowercase, and a number.";
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
    const result = isRegister
      ? await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        })
      : await login(form.email.trim(), form.password);
    setSubmitting(false);

    if (result.success) navigate(landingPathForRole(result.user?.role), { replace: true });
  };

  const handleGoogleClick = () => {
    if (!hasGoogleClientId) {
      toast.error(
        "Google sign-in isn't configured. Add VITE_GOOGLE_CLIENT_ID to client/.env.",
      );
      return;
    }
    if (!googleReady) {
      toast.error("Google sign-in is still loading — try again in a moment.");
      return;
    }
    // TEMP DIAGNOSTIC: One Tap's prompt() fails silently (no error, no callback)
    // when Google suppresses it (cooldown, third-party cookies, FedCM). Logging
    // the moment notification surfaces the real reason. Remove once resolved.
    window.google.accounts.id.prompt((notification) => {
      console.log("[Google Sign-In] moment notification", {
        isDisplayed: notification.isDisplayed(),
        isNotDisplayed: notification.isNotDisplayed(),
        notDisplayedReason: notification.getNotDisplayedReason?.(),
        isSkippedMoment: notification.isSkippedMoment(),
        skippedReason: notification.getSkippedReason?.(),
        isDismissedMoment: notification.isDismissedMoment(),
        dismissedReason: notification.getDismissedReason?.(),
      });
    });
  };

  const comingSoon = (feature) => () =>
    toast.info(`${feature} is coming soon.`);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background text-on-background font-body-main">
      {/* ── Left: editorial brand panel ── */}
      <aside className="hidden lg:flex w-[45%] bg-surface-bone flex-col justify-between border-r border-hairline relative">
        <div className="px-grid-margin py-section-gap z-10 flex-shrink-0">
          <Link to="/" className="inline-block">
            <Wordmark className="text-[28px] mb-section-gap block" />
          </Link>
          <h1 className="font-display-hero text-display-hero text-primary lowercase tracking-tighter leading-none mb-6">
            find your people,
            <br />
            then your place.
          </h1>
          <p className="font-body-main text-body-main text-slate-muted max-w-md">
            Join a community of verified student housing, honest resident
            reviews, and roommate matching.
          </p>
        </div>

        <div className="flex-grow relative overflow-hidden px-grid-margin pb-grid-margin min-h-0">
          <div className="w-full h-full rounded-xl overflow-hidden relative">
            <img
              src={authHero}
              alt="A warm, sun-drenched modern student apartment interior with a wooden desk, a neat bed with a green throw, and large windows letting in golden-hour light."
              className="absolute inset-0 w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>

        <div className="px-grid-margin pb-grid-margin z-10 flex-shrink-0 pt-4">
          <p className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase tracking-widest">
            made for students, by students.
          </p>
        </div>
      </aside>

      {/* ── Right: auth form panel ── */}
      <main className="w-full lg:w-[55%] flex flex-col justify-center items-center px-6 md:px-12 lg:px-24 overflow-y-auto bg-surface py-12">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden mb-12 text-center">
            <Link to="/" className="inline-block">
              <Wordmark className="text-3xl mb-6 inline-block" />
            </Link>
            <h1 className="font-display-hero text-display-hero-mobile text-primary lowercase tracking-tighter leading-none">
              welcome to boma.
            </h1>
          </div>

          {/* Eyebrow */}
          <div className="hidden lg:block mb-8">
            <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase tracking-widest">
              welcome to boma
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-hairline mb-8">
            <Link
              to="/login"
              className={`flex-1 pb-4 text-center border-b-2 transition-colors ${
                !isRegister
                  ? "font-body-strong text-body-strong text-primary border-secondary-container"
                  : "font-body-main text-body-main text-slate-muted border-transparent hover:text-primary"
              }`}
            >
              sign in
            </Link>
            <Link
              to="/register"
              className={`flex-1 pb-4 text-center border-b-2 transition-colors ${
                isRegister
                  ? "font-body-strong text-body-strong text-primary border-secondary-container"
                  : "font-body-main text-body-main text-slate-muted border-transparent hover:text-primary"
              }`}
            >
              create account
            </Link>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {isRegister && (
              <div className="grid grid-cols-2 gap-4">
                {ROLE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={form.role === opt.value}
                      onChange={onChange}
                      className="peer sr-only"
                    />
                    <div className="h-full border border-hairline rounded-lg p-4 text-center peer-checked:border-primary peer-checked:bg-surface-container-low transition-all">
                      <span className="material-symbols-outlined mb-2 text-primary">
                        {opt.icon}
                      </span>
                      <div className="font-body-strong text-sm text-primary lowercase">
                        {opt.label}
                      </div>
                      <div className="font-label-eyebrow text-[10px] uppercase tracking-widest text-slate-muted mt-1">
                        {opt.sub}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {isRegister && (
              <div>
                <label className={LABEL_CLASS} htmlFor="auth-name">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onChange}
                  className={INPUT_CLASS}
                  placeholder="Amina Wanjiru"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className={LABEL_CLASS} htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className={INPUT_CLASS}
                placeholder="student@university.edu"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={`${LABEL_CLASS} mb-0`} htmlFor="auth-password">
                  Password
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={comingSoon("Password reset")}
                    className="font-label-eyebrow text-label-eyebrow text-primary hover:text-secondary-container transition-colors lowercase"
                  >
                    forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  className={INPUT_CLASS}
                  placeholder={
                    isRegister ? "Create a strong password" : "••••••••"
                  }
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "20px" }}
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {isRegister && (
                <p className="font-body-main text-xs text-slate-muted mt-2">
                  8+ characters with uppercase, lowercase &amp; a number.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-secondary-container text-primary font-body-strong text-body-strong py-3 rounded-lg hover:bg-secondary-fixed transition-all mt-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? "please wait…"
                : isRegister
                  ? "create account"
                  : "sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-grow border-t border-hairline" />
            <span className="px-4 font-label-eyebrow text-label-eyebrow text-slate-muted uppercase">
              or
            </span>
            <div className="flex-grow border-t border-hairline" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-full bg-transparent border border-hairline text-primary font-body-strong text-body-strong py-3 rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            continue with Google
          </button>

          {/* Footer links */}
          <div className="mt-12 text-center flex justify-center gap-6">
            <button
              type="button"
              onClick={comingSoon("Terms of service")}
              className="font-label-eyebrow text-label-eyebrow text-slate-muted hover:text-primary transition-colors lowercase"
            >
              terms of service
            </button>
            <button
              type="button"
              onClick={comingSoon("Privacy policy")}
              className="font-label-eyebrow text-label-eyebrow text-slate-muted hover:text-primary transition-colors lowercase"
            >
              privacy policy
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
