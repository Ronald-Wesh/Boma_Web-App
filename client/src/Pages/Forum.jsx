import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { forumAPI } from "../Utils/api";
import { useAuth } from "../hooks/useAuth";
import ForumPostCard from "../components/forum/ForumPostCard";
import ForumComposer from "../components/forum/ForumComposer";

const SKELETON_COUNT = 6;

// Flatten Forum docs into a single feed of thread entries, newest first.
function flatten(forums) {
  const rows = [];
  for (const doc of forums) {
    for (const entry of doc.post || []) {
      rows.push({
        entry,
        docId: doc._id,
        ownerId: doc.user?._id,
        author: doc.user?.name,
        building: doc.building,
        createdAt: doc.createdAt,
      });
    }
  }
  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export default function Forum() {
  const { isAuthenticated, user } = useAuth();
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await forumAPI.getAllForums();
      setForums(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load forums", error);
      toast.error(error.response?.data?.message || "Failed to load forum posts");
      setForums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (buildingId, payload) => {
    try {
      await forumAPI.createForum(buildingId, payload);
      toast.success("Posted");
      await load();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post");
      return false;
    }
  };

  const handleDelete = async (docId) => {
    try {
      await forumAPI.deleteForum(docId);
      setForums((prev) => prev.filter((doc) => doc._id !== docId));
      toast.success("Post deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  const rows = flatten(forums);

  return (
    <div>
      {/* Header */}
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-screen-2xl mx-auto px-grid-margin flex flex-wrap justify-between items-end gap-stack-md">
          <div>
            <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase">
              community forum
            </span>
            <h1 className="font-display-hero text-display-hero-mobile md:text-display-hero text-primary lowercase max-w-4xl mt-stack-sm mb-stack-md">
              ask. answer. settle in.
            </h1>
            <p className="font-body-main text-body-main text-slate-muted max-w-2xl">
              questions, tips and notices from residents of each building —
              straight from the people who live there.
            </p>
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setComposing((v) => !v)}
              className="bg-secondary-container text-honey-ink px-6 py-2 rounded-full font-body-strong transition-all hover:brightness-110 active:scale-95"
            >
              {composing ? "close" : "start a post"}
            </button>
          ) : (
            <Link
              to="/login"
              className="font-body-strong text-primary hover:underline"
            >
              sign in to post
            </Link>
          )}
        </div>
      </header>

      {/* Feed */}
      <main className="w-full py-section-gap">
        <div className="max-w-3xl mx-auto px-grid-margin">
          {composing && (
            <ForumComposer
              onCreate={handleCreate}
              onClose={() => setComposing(false)}
            />
          )}

          {loading ? (
            <div className="border-t border-hairline">
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <div key={index} className="py-stack-lg border-b border-hairline">
                  <div className="h-4 w-32 bg-surface-container animate-pulse mb-3" />
                  <div className="h-5 w-48 bg-surface-container animate-pulse mb-2" />
                  <div className="h-3 w-full bg-surface-container animate-pulse" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-section-gap min-h-[40vh]">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
                forum
              </span>
              <h3 className="font-headline-section text-2xl text-primary lowercase mb-2">
                no posts yet
              </h3>
              <p className="font-body-main text-on-surface-variant max-w-sm">
                be the first to start a conversation about your building.
              </p>
            </div>
          ) : (
            <div className="border-t border-hairline">
              {rows.map((row) => (
                <ForumPostCard
                  key={row.entry._id}
                  entry={row.entry}
                  author={row.author}
                  building={row.building}
                  createdAt={row.createdAt}
                  isOwner={isAuthenticated && user?._id === row.ownerId}
                  onDelete={() => handleDelete(row.docId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
