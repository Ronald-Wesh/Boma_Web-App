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
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import CreateListingPage from "./Pages/CreateListingPage";
import ListingDetailPage from "./Pages/ListingDetailPage";
import ListingsPage from "./Pages/ListingsPage";
import { useAuth } from "./hooks/useAuth";
import { LandlordRoute } from "./Utils/protectedRoute";

function AppNavigation() {
  const { isAuthenticated, isLandlord, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/listings" className="text-lg font-semibold tracking-tight text-slate-950">
          Boma
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/listings"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Listings
          </Link>

          {isLandlord && (
            <Link
              to="/listings/create"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Create
            </Link>
          )}

          <span className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500 sm:inline-flex">
            {isAuthenticated ? `${user?.name || user?.email} · ${user?.role}` : "Guest"}
          </span>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <AppNavigation />
      <Routes>
        <Route path="/" element={<Navigate to="/listings" replace />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route
          path="/listings/create"
          element={
            <LandlordRoute>
              <CreateListingPage />
            </LandlordRoute>
          }
        />
      </Routes>
      <Toaster position="top-right" richColors />
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
