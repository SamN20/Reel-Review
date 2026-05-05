import { useState, useEffect } from "react";
import axios from "axios";
import { useDraggableScroll } from "../../../hooks/useDraggableScroll";

const API_URL = import.meta.env.VITE_API_URL || "";

interface FlaggedItem {
  id: string;
  target_type: "review" | "reply";
  target_id: number;
  user_id: number;
  username: string;
  movie_title: string;
  review_text: string | null;
  is_approved: boolean;
  created_at: string;
  reason_counts: {
    harmful_or_spam: number;
    spoiler: number;
  };
}

export function ModerationTab() {
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollProps = useDraggableScroll<HTMLDivElement>();

  const fetchFlaggedContent = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/api/v1/admin/moderation/flagged`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setItems(res.data);
      setError("");
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to fetch flagged content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchFlaggedContent();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleApprove = async (item: FlaggedItem) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/v1/admin/moderation/${item.target_type === "review" ? "reviews" : "replies"}/${item.target_id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setItems(items.filter((queuedItem) => queuedItem.id !== item.id));
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to approve content");
    }
  };

  const handleRemove = async (item: FlaggedItem) => {
    if (!window.confirm("Are you sure you want to censor this review?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_URL}/api/v1/admin/moderation/${item.target_type === "review" ? "reviews" : "replies"}/${item.target_id}`,
        {
        headers: { Authorization: `Bearer ${token}` },
        },
      );
      setItems(items.filter((queuedItem) => queuedItem.id !== item.id));
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to remove content");
    }
  };

  const handleMarkSpoiler = async (item: FlaggedItem) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/v1/admin/moderation/${item.target_type === "review" ? "reviews" : "replies"}/${item.target_id}/mark-spoiler`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setItems(items.filter((queuedItem) => queuedItem.id !== item.id));
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to move content to spoilers");
    }
  };

  if (loading)
    return <div className="text-zinc-400">Loading flagged content...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">Moderation Queue</h2>
      </div>

      {error && (
        <div className="text-red-500 bg-red-950/20 p-4 rounded-lg border border-red-900/50">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div
          {...scrollProps}
          className="overflow-x-auto custom-scrollbar cursor-grab active:cursor-grabbing"
        >
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Movie</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Flagged Text</th>
                <th className="px-6 py-4 font-medium">Reports</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                      {item.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.movie_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400 uppercase text-xs font-bold tracking-widest">
                      {item.target_type}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md truncate text-red-400 bg-red-950/20 p-2 rounded border border-red-900/30">
                        {item.review_text}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-400">
                      H/S {item.reason_counts.harmful_or_spam} • Spoiler {item.reason_counts.spoiler}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500 text-xs">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        {item.reason_counts.spoiler > 0 ? (
                          <button
                            onClick={() => handleMarkSpoiler(item)}
                            className="px-3 py-1.5 rounded transition-colors text-amber-300 bg-amber-950/30 hover:bg-amber-900/50 border border-amber-900/50"
                          >
                            Move to Spoilers
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleApprove(item)}
                          className="px-3 py-1.5 rounded transition-colors text-green-400 bg-green-950/30 hover:bg-green-900/50 border border-green-900/50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRemove(item)}
                          className="px-3 py-1.5 rounded transition-colors text-red-400 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50"
                        >
                          Remove Text
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No flagged content in the queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
