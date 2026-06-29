import "./App.css";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import SiteLayout from "./components/layout/SiteLayout";
import Home from "./Pages/Home";
import Listings from "./Pages/Listing";
import AuthPage from "./Pages/Auth";
import ComingSoon from "./Pages/ComingSoon";

export default function App() {
  return (
    <>
      <Routes>
        {/* Chromed pages share the editorial header + footer */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Listings />} />
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
