import { Link } from "react-router-dom";

const MAX_PREVIEW_POSTS = 3;

// building: the Listing.building populate shape (name/address/average_rating/total_reviews).
// forumPosts: ForumPost[] for this building (already sorted newest-first by the API), or null while loading.
export default function LandlordBuildingCard({ building, forumPosts }) {
  const recentPosts = (forumPosts || []).slice(0, MAX_PREVIEW_POSTS);

  return (
    <article className="bg-surface p-6 flex flex-col gap-4 border border-hairline rounded-xl">
      <div>
        <h3 className="font-headline-section text-xl text-primary lowercase">
          {building.name}
        </h3>
        <p className="font-body-main text-sm text-slate-muted">{building.address}</p>
      </div>

      {building.average_rating > 0 && (
        <div className="flex items-center gap-1 text-secondary-container">
          <span
            className="material-symbols-outlined text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
          <span className="font-body-strong">{building.average_rating.toFixed(1)}</span>
          <span className="text-slate-muted font-body-main text-sm">
            ({building.total_reviews || 0} reviews)
          </span>
        </div>
      )}

      <div className="pt-3 border-t border-hairline">
        <p className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase mb-2">
          recent forum activity
        </p>
        {forumPosts === null ? (
          <div className="space-y-2">
            <div className="h-4 bg-surface-container animate-pulse rounded" />
            <div className="h-4 bg-surface-container animate-pulse rounded w-2/3" />
          </div>
        ) : recentPosts.length === 0 ? (
          <p className="font-body-main text-sm text-slate-muted">
            no forum posts for this building yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {recentPosts.map((doc) => (
              <li key={doc._id} className="font-body-main text-sm text-primary truncate">
                {doc.post?.[0]?.title || "untitled post"}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-hairline">
        <Link
          to={`/reviews/${building._id}`}
          className="font-body-strong text-sm text-primary hover:text-secondary-container transition-colors"
        >
          view reviews
        </Link>
        <Link
          to="/forums"
          className="font-body-strong text-sm text-primary hover:text-secondary-container transition-colors"
        >
          view forum
        </Link>
      </div>
    </article>
  );
}
