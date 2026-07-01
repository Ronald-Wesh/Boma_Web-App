import { useEffect, useState } from "react";
import { toast } from "sonner";
import { forumAPI } from "../../Utils/api";
import { monthYear } from "../../Utils/listingHelpers";

// Lazy-loaded comment thread for a single forum entry.
export default function ForumComments({
  entryId,
  isAuthenticated,
  currentUserId,
  onCountChange,
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    forumAPI
      .getForumComments(entryId)
      .then(({ data }) => active && setComments(Array.isArray(data) ? data : []))
      .catch(() => active && toast.error("Failed to load comments"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [entryId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await forumAPI.addForumComment(entryId, {
        content: text.trim(),
        isAnonymous,
      });
      setComments((prev) => [...prev, data]);
      setText("");
      onCountChange(1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await forumAPI.deleteForumComment(id);
      setComments((prev) => prev.filter((c) => c._id !== id));
      onCountChange(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="mt-stack-md pl-stack-md border-l-2 border-hairline">
      {loading ? (
        <p className="font-label-eyebrow text-label-eyebrow text-slate-muted">
          loading comments…
        </p>
      ) : (
        <div className="flex flex-col gap-stack-md">
          {comments.map((c) => (
            <div key={c._id} className="flex justify-between items-start gap-3">
              <div>
                <p className="font-label-eyebrow text-label-eyebrow text-slate-muted mb-1">
                  {c.isAnonymous ? "anonymous" : c.user?.name || "resident"} ·{" "}
                  {monthYear(c.createdAt)}
                </p>
                <p className="font-body-main text-primary">{c.content}</p>
              </div>
              {currentUserId && c.user?._id === currentUserId && (
                <button
                  type="button"
                  onClick={() => handleDelete(c._id)}
                  aria-label="Delete comment"
                  className="material-symbols-outlined text-base text-slate-muted hover:text-primary transition-colors"
                >
                  delete
                </button>
              )}
            </div>
          ))}
          {comments.length === 0 && (
            <p className="font-body-main text-slate-muted">no comments yet.</p>
          )}

          {isAuthenticated ? (
            <form onSubmit={handleAdd} className="flex flex-col gap-2 mt-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="add a comment…"
                rows={2}
                className="w-full bg-surface border border-hairline px-3 py-2 font-body-main text-primary focus:outline-none focus:border-secondary-container"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-secondary-container text-honey-ink px-4 py-1.5 rounded-full font-body-strong text-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "posting…" : "comment"}
                </button>
                <label className="flex items-center gap-1.5 font-label-eyebrow text-label-eyebrow text-slate-muted">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  anonymous
                </label>
              </div>
            </form>
          ) : (
            <p className="font-body-main text-slate-muted">sign in to comment.</p>
          )}
        </div>
      )}
    </div>
  );
}
