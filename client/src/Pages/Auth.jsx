import React, { useEffect, useEffectEvent, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{8,}$/;

const initialFormState = {
  name: "",
  email: "",
  password: "",
  role: "tenant",
};

const authHighlights = [
  "Smart Listings: Filter, explore, and find your next space in minutes.",
  "Building Communities: Don’t just move in — plug into your building.",
  "Real Tenant Reviews: No fake ratings. Just real experiences. Know what it’s actually like before you move in.",
];

const isConfiguredGoogleClientId = (clientId) =>
  Boolean(clientId) &&
  !clientId.includes("your-google-web-client-id.apps.googleusercontent.com");

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, login, loginWithGoogle, register } =
    useAuth();
  const isRegister = location.pathname === "/register";
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(
    typeof window !== "undefined" && Boolean(window.google?.accounts?.id),
  );
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";
  const hasGoogleClientId = isConfiguredGoogleClientId(googleClientId);

  const handleGoogleCredential = useEffectEvent(async ({ credential }) => {
    const result = await loginWithGoogle({ credential });
    if (result.success) {
      navigate("/listings", { replace: true });
    }
  });

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return undefined;
    }

    const pollGoogle = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        setGoogleReady(true);
        window.clearInterval(pollGoogle);
      }
    }, 250);

    return () => {
      window.clearInterval(pollGoogle);
    };
  }, []);

  useEffect(() => {
    if (!googleReady || !hasGoogleClientId || !googleButtonRef.current) {
      return undefined;
    }

    if (isAuthenticated) {
      window.google?.accounts?.id?.cancel?.();
      return undefined;
    }

    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity) {
      return undefined;
    }

    googleIdentity.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
      auto_select: true,
    });

    googleButtonRef.current.innerHTML = "";
    googleIdentity.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      text: isRegister ? "signup_with" : "signin_with",
      shape: "pill",
      width: googleButtonRef.current.offsetWidth || 360,
    });
    googleIdentity.prompt();

    return () => {
      googleIdentity.cancel?.();
    };
  }, [
    googleClientId,
    hasGoogleClientId,
    googleReady,
    handleGoogleCredential,
    isAuthenticated,
    isRegister,
  ]);

  useEffect(() => {
    setFormData(initialFormState);
    setSubmitting(false);
  }, [isRegister]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-stone-950 text-stone-100">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400" />
          <span className="text-sm font-medium">Checking session...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/listings" replace />;
  }

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    if (!EMAIL_REGEX.test(formData.email.trim())) {
      return "Enter a valid email address";
    }

    if (!formData.password) {
      return "Password is required";
    }

    if (isRegister && formData.name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }

    if (isRegister && !PASSWORD_REGEX.test(formData.password)) {
      return "Password must be at least 8 characters and include uppercase, lowercase, and a number";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);

    const result = isRegister
      ? await register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        })
      : await login(formData.email.trim(), formData.password);

    setSubmitting(false);

    if (result.success) {
      navigate("/listings", { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[linear-gradient(135deg,#f6efe5_0%,#d7e7de_45%,#13261d_100%)] px-4 py-8 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-black/10 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-[#133127] px-6 py-10 text-stone-100 sm:px-10 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-6">
              <p className="inline-flex rounded-full mr-2 border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-amber-200">
                Find better homes.
              </p>
              <p className="inline-flex rounded-full mr-2 border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-amber-200">
                Rent with confidence.
              </p>
              <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-amber-200">
                Live smarter.
              </p>

              <div className="space-y-4">
                <h1 className="text-display max-w-2xl text-4xl leading-tight text-cyan-50 md:text-6xl">
                  Rent decisions move faster when identity is simple.
                </h1>
                <p className="max-w-lg text-sm leading-7 text-stone-300 sm:text-base">
                  Find verified rental listings tailored to your lifestyle, all
                  in one place. Connect with your building community through
                  private forums and real conversations. Make confident
                  decisions using honest tenant reviews before you move in
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {authHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-stone-200"
                >
                  {item}
                </div>
              ))}
            </div>
            Join now. Find your space. Know your neighbors before you move in.
          </div>
        </section>

        <section className="flex items-center bg-[#fffdf8] px-6 py-10 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md space-y-7">
            <div className="space-y-3">
              <div className="inline-flex rounded-full bg-stone-900 p-1 text-sm">
                <Link
                  to="/login"
                  className={`rounded-full px-4 py-2 transition ${
                    !isRegister
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-300"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`rounded-full px-4 py-2 transition ${
                    isRegister
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-300"
                  }`}
                >
                  Create Account
                </Link>
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
                  {isRegister ? "Create your account" : "Welcome back"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {isRegister
                    ? "Use email/password or Google Services to register"
                    : "Continue with Google or sign in with the account you already use for Boma."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {hasGoogleClientId ? (
                <div
                  ref={googleButtonRef}
                  className="flex min-h-10 items-center justify-center rounded-full bg-white"
                />
              ) : (
                <div className="flex min-h-11 items-center justify-center rounded-full border border-dashed border-stone-300 bg-stone-50 px-4 text-sm text-stone-500">
                  Google sign-in is unavailable in this environment.
                </div>
              )}
              {!hasGoogleClientId && (
                <p className="text-xs leading-5 text-amber-700">
                  Add a real `VITE_GOOGLE_CLIENT_ID` in `client/.env` to enable
                  Google sign-in and One Tap.
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs font-medium uppercase tracking-[0.24em] text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              <span>or use email</span>
              <span className="h-px flex-1 bg-stone-200" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isRegister && (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-stone-700">
                    Full Name
                  </span>
                  <input
                    required
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={onChange}
                    className="w-full rounded-2xl border border-stone-00 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900"
                    placeholder="Amina Wanjiru"
                  />
                </label>
              )}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Email Address
                </span>
                <input
                  required
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={onChange}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Password
                </span>
                <input
                  required
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={onChange}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900"
                  placeholder="At least 8 characters"
                />
              </label>

              {isRegister && (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-stone-700">
                    Account Type
                  </span>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={onChange}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900"
                  >
                    <option value="tenant">Tenant</option>
                    <option value="landlord">Landlord</option>
                  </select>
                </label>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Please wait..."
                  : isRegister
                    ? "Create Boma Account"
                    : "Sign In"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
