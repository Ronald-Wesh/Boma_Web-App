import "./App.css";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import SiteLayout from "./components/layout/SiteLayout";
import Home from "./Pages/Home";
import Browse from "./Pages/Browse";
import ListingDetail from "./Pages/ListingDetail";
import Roommates from "./Pages/Roommates";
import RoommateProfileEditor from "./Pages/RoommateProfileEditor";
import Reviews from "./Pages/Reviews";
import BuildingReviews from "./Pages/BuildingReviews";
import AuthPage from "./Pages/Auth";
import ComingSoon from "./Pages/ComingSoon";

export default function App() {
  return (
    <>
      <Routes>
        {/* Chromed pages share the editorial header + footer */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Browse />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/roommates" element={<Roommates />} />
          <Route path="/roommates/profile" element={<RoommateProfileEditor />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/reviews/:buildingId" element={<BuildingReviews />} />
          {/* Unbuilt editorial pages land here until they're built */}
          <Route path="*" element={<ComingSoon />} />
        </Route>

        {/* Auth screens are full-screen, outside the shared layout */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
      </Routes>

      <Toaster richColors position="top-right" />
    </>
  );
}
