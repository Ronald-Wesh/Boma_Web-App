import { Link } from "react-router-dom";
import Stars from "./Stars";

// One building tile in the reviews directory grid.
export default function BuildingReviewCard({ building, reviewCount }) {
  const average = building?.average_rating || 0;
  return (
    <Link
      to={`/reviews/${building._id}`}
      className="group bg-surface p-stack-lg flex flex-col gap-stack-md hover:bg-surface-bone transition-colors"
    >
      <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase">
        verified residents
      </span>

      <div>
        <h3 className="font-headline-section text-[22px] text-primary lowercase group-hover:underline">
          {building?.name || "building"}
        </h3>
        {building?.address && (
          <p className="font-body-main text-sm text-slate-muted mt-1">
            {building.address}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 pt-stack-md">
        <div className="flex flex-col">
          <span className="text-[40px] font-display-hero text-secondary-container leading-none">
            {average.toFixed(1)}
          </span>
          <div className="mt-1 scale-75 origin-left">
            <Stars value={average} />
          </div>
        </div>
        <span className="font-label-eyebrow text-[10px] text-slate-muted uppercase whitespace-nowrap">
          {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
        </span>
      </div>
    </Link>
  );
}
