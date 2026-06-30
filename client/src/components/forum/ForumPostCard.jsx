import { Link } from "react-router-dom";
import { monthYear } from "../../Utils/listingHelpers";

// One forum thread row. `entry` is an item from a Forum doc's post[] array.
export default function ForumPostCard({
  entry,
  author,
  building,
  createdAt,
  isOwner,
  onDelete,
}) {
  const name = entry.isAnonymous ? "anonymous resident" : author || "resident";

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
            {name} · {monthYear(createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {entry.resolved && (
            <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase border border-hairline px-2 py-1">
              resolved
            </span>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete post"
              className="material-symbols-outlined text-base text-slate-muted hover:text-primary transition-colors"
            >
              delete
            </button>
          )}
        </div>
      </div>

      {entry.title && (
        <p className="font-body-strong text-primary mb-1">{entry.title}</p>
      )}
      {entry.content && (
        <p className="text-slate-muted mb-stack-md">{entry.content}</p>
      )}

      <div className="flex items-center gap-stack-md font-label-eyebrow text-label-eyebrow text-slate-muted">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">arrow_upward</span>
          {entry.upvotes || 0}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">arrow_downward</span>
          {entry.downvotes || 0}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">chat_bubble</span>
          {entry.comments || 0}
        </span>
      </div>
    </article>
  );
}
