import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildingAPI } from "../../Utils/api";

// Inline composer for starting a new forum thread. Calls onCreate(buildingId, payload).
export default function ForumComposer({ onCreate, onClose }) {
  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    buildingAPI
      .getAllBuildings()
      .then(({ data }) => setBuildings(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load buildings"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buildingId || !title.trim() || !content.trim()) {
      toast.error("Pick a building and add a title and message");
      return;
    }
    setSubmitting(true);
    const ok = await onCreate(buildingId, {
      post: [{ title: title.trim(), content: content.trim(), isAnonymous }],
    });
    setSubmitting(false);
    if (ok) onClose();
  };

  const fieldClass =
    "w-full bg-surface border border-hairline px-4 py-3 font-body-main text-primary focus:outline-none focus:border-secondary-container";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-bone border border-hairline p-stack-lg mb-section-gap"
    >
      <div className="flex flex-col gap-stack-md">
        <select
          value={buildingId}
          onChange={(e) => setBuildingId(e.target.value)}
          className={fieldClass}
        >
          <option value="">select a building…</option>
          {buildings.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="title"
          className={fieldClass}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="what's on your mind?"
          rows={4}
          className={fieldClass}
        />

        <label className="flex items-center gap-2 font-body-main text-slate-muted">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          post anonymously
        </label>

        <div className="flex gap-stack-md">
          <button
            type="submit"
            disabled={submitting}
            className="bg-secondary-container text-honey-ink px-6 py-2 rounded-full font-body-strong transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {submitting ? "posting…" : "post"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant font-body-strong hover:text-primary transition-colors"
          >
            cancel
          </button>
        </div>
      </div>
    </form>
  );
}
