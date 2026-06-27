// import "./App.css";
// import { Routes, Route } from "react-router-dom";
// import { UserButton, SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
// import Listings from "./Pages/Listing";

// function App() {
//   return (
//     <>
//       <nav className="flex justify-between items-center p-4 bg-white shadow-md">
//         <SignedIn>
//           <UserButton />
//         </SignedIn>
//       </nav>

//       <Routes>
//         {/* Listings page (main app) */}
//         <Route
//           path="/"
//           element={
//             <>
//               <SignedIn>
//                 <Listings />
//               </SignedIn>
//               <SignedOut>
//                 <div className="flex justify-center items-center h-screen">
//                   <SignIn />
//                 </div>
//               </SignedOut>
//             </>
//           }
//         />
//       </Routes>
//     </>
//   );
// }

// export default App;
import "./App.css";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Listings from "./Pages/Listing";
import AuthPage from "./Pages/Auth";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const onAuthScreen =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200/70 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-sm font-semibold text-amber-300">
            B
          </span>
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-stone-500">
              BOMA
            </p>
            <p className="text-sm text-stone-700">
              {onAuthScreen ? "Authentication" : "Listings"}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-stone-900">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  {user?.authProvider || "password"}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 transition hover:border-stone-900 hover:bg-stone-900 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        {/* Public listings home — no login required (blueprint: Listings is the public core) */}
        <Route path="/" element={<Listings />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
      </Routes>

      <Toaster richColors position="top-right" />
    </>
  );
}


// import "./App.css";
// import { Routes, Route } from "react-router-dom";
// import { UserButton, SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
// import { toast} from "sonner";
// import { useEffect } from "react";

// function App() {
//   return (
//     <>
//       <nav className="flex justify-between items-center p-4 bg-white shadow-md">
//         <SignedIn>
//           <UserButton />
//         </SignedIn>
//       </nav>

//       {/* Render form directly */}
//       <div className="flex justify-center items-center h-screen">
//         <SignedOut>
//           <SignIn />
//         </SignedOut>
//       </div>
//     </>
//   );
// }

// export defaul
