import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { reviewAPI } from "../Utils/api";
import CommunityFeedback from "../components/listings/CommunityFeedback";

export default function BuildingReviews() {
  const { buildingId } = useParams();
  const [building, setBuilding] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const { data } = await reviewAPI.getBuildingReviews(buildingId);
      if (!data?.building) {
        setNotFound(true);
        return;
      }
      setBuilding(data.building);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Failed to load building reviews", error);
      toast.error(
        error.response?.data?.message || "Failed to load this building",
      );
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      {/* Header */}
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-screen-2xl mx-auto px-grid-margin">
          <Link
            to="/reviews"
            className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase hover:text-primary transition-colors"
          >
            ← all reviews
          </Link>
          <h1 className="font-display-hero text-display-hero-mobile md:text-display-hero text-primary lowercase max-w-4xl mt-stack-sm">
            {loading ? "loading…" : building?.name?.toLowerCase() || "building"}
          </h1>
          {building?.address && (
            <p className="font-body-main text-body-main text-slate-muted max-w-2xl mt-stack-sm">
              {building.address}
            </p>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="w-full py-section-gap">
        <div className="max-w-3xl mx-auto px-grid-margin">
          {loading ? (
            <div className="space-y-4">
              <div className="h-16 w-32 bg-surface-container animate-pulse" />
              <div className="h-2 w-full bg-surface-container animate-pulse" />
              <div className="h-2 w-full bg-surface-container animate-pulse" />
              <div className="h-2 w-2/3 bg-surface-container animate-pulse" />
            </div>
          ) : notFound ? (
            <div className="flex flex-col items-center justify-center text-center py-section-gap min-h-[40vh]">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
                domain_disabled
              </span>
              <h3 className="font-headline-section text-2xl text-primary lowercase mb-2">
                building not found
              </h3>
              <Link
                to="/reviews"
                className="font-body-main text-secondary-container hover:underline lowercase"
              >
                back to all reviews
              </Link>
            </div>
          ) : (
            <CommunityFeedback building={building} reviews={reviews} />
          )}
        </div>
      </main>
    </div>
  );
}
