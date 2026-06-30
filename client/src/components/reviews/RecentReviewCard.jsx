import { Link } from "react-router-dom";
import Stars from "./Stars";
import { categoryAverage, monthYear } from "../../Utils/listingHelpers";

// One row in the recent-reviews feed.
export default function RecentReviewCard({ review }) {
  const rating = categoryAverage(review.categories);
  const author = review.isAnonymous
    ? "anonymous resident"
    : review.reviewer?.name || "resident";
  const building = review.building;

  return (
    <article className="py-stack-lg border-b border-hairline">
      <div className="flex justify-between items-start mb-3 gap-4">
        <div>
          {building?._id ? (
            <Link
              to={`/reviews/${building._id}`}
              className="font-body-strong text-primary lowercase hover:underline"
            >
              {building.name || "building"}
            </Link>
          ) : (
            <p className="font-body-strong text-primary lowercase">building</p>
          )}
          <p className="font-label-eyebrow text-label-eyebrow text-slate-muted">
            {author} · {monthYear(review.createdAt)}
          </p>
        </div>
        <div className="scale-75 origin-right">
          <Stars value={rating} />
        </div>
      </div>
      {review.title && (
        <p className="font-body-strong text-primary mb-1">{review.title}</p>
      )}
      {review.comment && (
        <p className="text-slate-muted italic">&ldquo;{review.comment}&rdquo;</p>
      )}
    </article>
  );
}
