import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { reviewAPI } from "../Utils/api";
import BuildingReviewCard from "../components/reviews/BuildingReviewCard";
import RecentReviewCard from "../components/reviews/RecentReviewCard";

const SKELETON_COUNT = 6;
const RECENT_LIMIT = 8;

// Group reviews by building, ranked by average rating desc.
function rankBuildings(reviews) {
  const map = new Map();
  for (const review of reviews) {
    const building = review.building;
    if (!building?._id) continue;
    if (!map.has(building._id)) {
      map.set(building._id, { building, count: 0 });
    }
    map.get(building._id).count += 1;
  }
  return [...map.values()].sort(
    (a, b) => (b.building.average_rating || 0) - (a.building.average_rating || 0),
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await reviewAPI.getAllReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load reviews", error);
      toast.error(
        error.response?.data?.message || "Failed to load building reviews",
      );
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buildings = rankBuildings(reviews);
  const recent = reviews.slice(0, RECENT_LIMIT);

  return (
    <div>
      {/* Header */}
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-screen-2xl mx-auto px-grid-margin">
          <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase">
            building reviews
          </span>
          <h1 className="font-display-hero text-display-hero-mobile md:text-display-hero text-primary lowercase max-w-4xl mt-stack-sm mb-stack-md">
            real residents. honest ratings.
          </h1>
          <p className="font-body-main text-body-main text-slate-muted max-w-2xl">
            verified reviews on cleanliness, security, water, maintenance and
            landlords — from students who actually lived there.
          </p>
        </div>
      </header>

      {/* Feed */}
      <main className="w-full py-section-gap">
        <div className="max-w-screen-2xl mx-auto px-grid-margin">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border border-hairline">
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <div key={index} className="bg-surface p-stack-lg">
                  <div className="h-3 w-24 bg-surface-container animate-pulse mb-stack-md" />
                  <div className="h-5 w-40 bg-surface-container animate-pulse mb-2" />
                  <div className="h-3 w-32 bg-surface-container animate-pulse mb-stack-md" />
                  <div className="h-10 w-20 bg-surface-container animate-pulse" />
                </div>
              ))}
            </div>
          ) : buildings.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-section-gap min-h-[40vh]">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
                reviews
              </span>
              <h3 className="font-headline-section text-2xl text-primary lowercase mb-2">
                no reviews yet
              </h3>
              <p className="font-body-main text-on-surface-variant max-w-sm">
                be the first to review the building you live in.
              </p>
            </div>
          ) : (
            <>
              {/* Ranked building directory */}
              <div className="mb-stack-lg">
                <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase">
                  top-rated buildings
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border border-hairline mb-section-gap">
                {buildings.map(({ building, count }) => (
                  <BuildingReviewCard
                    key={building._id}
                    building={building}
                    reviewCount={count}
                  />
                ))}
              </div>

              {/* Recent reviews feed */}
              <div className="mb-stack-lg">
                <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase">
                  recent reviews
                </span>
              </div>
              <div className="border-t border-hairline max-w-3xl">
                {recent.map((review) => (
                  <RecentReviewCard key={review._id} review={review} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
