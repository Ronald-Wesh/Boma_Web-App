import "./App.css";
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import SiteLayout from "./components/layout/SiteLayout";
import Home from "./Pages/Home";
import Browse from "./Pages/Browse";
import ListingDetail from "./Pages/ListingDetail";

// Code-split the Map View so Leaflet stays out of the main bundle for users
// who never open the map.
const MapView = lazy(() => import("./Pages/MapView"));

// Shown while the lazy Map chunk loads.
function MapFallback() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-surface-bone">
      <span className="font-label-eyebrow text-label-eyebrow uppercase text-slate-muted">
        loading map…
      </span>
    </div>
  );
}
import Roommates from "./Pages/Roommates";
import RoommateProfileEditor from "./Pages/RoommateProfileEditor";
import Reviews from "./Pages/Reviews";
import BuildingReviews from "./Pages/BuildingReviews";
import Forum from "./Pages/Forum";
import AuthPage from "./Pages/Auth";
import ComingSoon from "./Pages/ComingSoon";
import LandlordListingForm from "./Pages/LandlordListingForm";
import { LandlordRoute } from "./Utils/protectedRoute";

export default function App() {
  return (
    <>
      <Routes>
        {/* Chromed pages share the editorial header + footer */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Browse />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route
            path="/map"
            element={
              <Suspense fallback={<MapFallback />}>
                <MapView />
              </Suspense>
            }
          />
          <Route path="/roommates" element={<Roommates />} />
          <Route path="/roommates/profile" element={<RoommateProfileEditor />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/reviews/:buildingId" element={<BuildingReviews />} />
          <Route path="/forums" element={<Forum />} />
          <Route
            path="/landlord/listings/new"
            element={
              <LandlordRoute>
                <LandlordListingForm />
              </LandlordRoute>
            }
          />
          <Route
            path="/landlord/listings/:id/edit"
            element={
              <LandlordRoute>
                <LandlordListingForm />
              </LandlordRoute>
            }
          />
          {/* Unbuilt editorial pages land here until they're built */}
          <Route path="*" element={<ComingSoon />} />
        </Route>

        {/* Auth screens are full-screen, outside the shared layout */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
      </Routes>

      <Toaster richColors position="top-right" closeButton />
    </>
  );
}
