import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { forumAPI } from "../../Utils/api";
import { monthYear } from "../../Utils/listingHelpers";
import ForumComments from "./ForumComments";

// One forum thread row. `entry` is an item from a Forum doc's post[] array.
export default function ForumPostCard({
  entry,
  author,
  building,
  createdAt,
  isOwner,
  onDelete,
  isAuthenticated,
  currentUserId,
}) {
  const name = entry.isAnonymous ? "anonymous resident" : author || "resident";

  const myInitialVote =
    entry.voters?.find((v) => v.user === currentUserId)?.value || 0;
  const [votes, setVotes] = useState({
    up: entry.upvotes || 0,
    down: entry.downvotes || 0,
    mine: myInitialVote,
  });
  const [commentCount, setCommentCount] = useState(entry.comments || 0);
  const [showComments, setShowComments] = useState(false);

  const handleVote = async (direction) => {
    if (!isAuthenticated) {
      toast.error("Sign in to vote");
      return;
    }
    try {
      const { data } = await forumAPI.voteForumPost(entry._id, direction);
      setVotes({ up: data.upvotes, down: data.downvotes, mine: data.myVote });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to vote");
    }
  };

  const voteClass = (active) =>
    `flex items-center gap-1 transition-colors ${
      active ? "text-primary" : "text-slate-muted hover:text-primary"
    }`;

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

      <div className="flex items-center gap-stack-md font-label-eyebrow text-label-eyebrow">
        <button
          type="button"
          onClick={() => handleVote("up")}
          className={voteClass(votes.mine === 1)}
          aria-label="Upvote"
        >
          <span className="material-symbols-outlined text-base">arrow_upward</span>
          {votes.up}
        </button>
        <button
          type="button"
          onClick={() => handleVote("down")}
          className={voteClass(votes.mine === -1)}
          aria-label="Downvote"
        >
          <span className="material-symbols-outlined text-base">arrow_downward</span>
          {votes.down}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className={voteClass(showComments)}
        >
          <span className="material-symbols-outlined text-base">chat_bubble</span>
          {commentCount}
        </button>
      </div>

      {showComments && (
        <ForumComments
          entryId={entry._id}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
          onCountChange={(delta) => setCommentCount((c) => Math.max(0, c + delta))}
        />
      )}
    </article>
  );
}
