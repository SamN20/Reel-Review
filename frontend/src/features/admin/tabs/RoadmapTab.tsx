import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle, ExternalLink, Eye, EyeOff, Plus, Search, XCircle } from "lucide-react";

import {
  approveFeatureSuggestion,
  createAdminRoadmapItem,
  getAdminFeatureSuggestions,
  getAdminRoadmap,
  rejectFeatureSuggestion,
  updateAdminRoadmapItem,
} from "../../roadmap/api";
import type { FeatureSuggestion, RoadmapItem, RoadmapItemPayload, RoadmapStatus, SuggestionStatus } from "../../roadmap/types";

const ROADMAP_STATUSES: RoadmapStatus[] = ["now", "next", "later", "shipped"];
const SUGGESTION_FILTERS: Array<SuggestionStatus | "all"> = ["pending", "approved", "rejected", "all"];

const emptyDraft: RoadmapItemPayload = {
  title: "",
  description: "",
  status: "next",
  is_public: false,
  sort_order: 0,
  cta_label: "",
  cta_url: "",
};

function statusClass(status: string) {
  if (status === "now" || status === "pending") return "border-red-500/40 bg-red-950/30 text-red-200";
  if (status === "next" || status === "approved") return "border-amber-500/40 bg-amber-950/30 text-amber-200";
  if (status === "shipped") return "border-emerald-500/40 bg-emerald-950/30 text-emerald-200";
  if (status === "rejected") return "border-zinc-600 bg-zinc-800/60 text-zinc-300";
  return "border-blue-500/40 bg-blue-950/30 text-blue-200";
}

function errorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail === "string"
  ) {
    return (error as { response: { data: { detail: string } } }).response.data.detail;
  }
  return fallback;
}

export function RoadmapTab() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus | "all">("pending");
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState<RoadmapItemPayload>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roadmapData, suggestionData] = await Promise.all([
        getAdminRoadmap(),
        getAdminFeatureSuggestions(suggestionStatus),
      ]);
      setItems(roadmapData);
      setSuggestions(suggestionData);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Failed to load roadmap admin data."));
    } finally {
      setLoading(false);
    }
  }, [suggestionStatus]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const visibleSuggestions = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return suggestions;
    return suggestions.filter(
      (suggestion) =>
        suggestion.title.toLowerCase().includes(q) ||
        (suggestion.description || "").toLowerCase().includes(q) ||
        suggestion.username.toLowerCase().includes(q),
    );
  }, [filter, suggestions]);

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      if (editingId) {
        await updateAdminRoadmapItem(editingId, draft);
        setMessage("Roadmap item updated.");
      } else {
        await createAdminRoadmapItem(draft);
        setMessage("Roadmap item created.");
      }
      resetDraft();
      await loadData();
    } catch (err) {
      setError(errorMessage(err, "Could not save roadmap item."));
    }
  };

  const startEditing = (item: RoadmapItem) => {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      description: item.description || "",
      status: item.status,
      is_public: item.is_public,
      sort_order: item.sort_order,
      cta_label: item.cta_label || "",
      cta_url: item.cta_url || "",
      source_suggestion_id: item.source_suggestion_id,
    });
  };

  const togglePublic = async (item: RoadmapItem) => {
    await updateAdminRoadmapItem(item.id, { is_public: !item.is_public });
    await loadData();
  };

  const promoteSuggestion = async (suggestion: FeatureSuggestion) => {
    setMessage("");
    setError("");
    try {
      await approveFeatureSuggestion(suggestion.id, {
        admin_note: adminNote || null,
        roadmap_item: {
          title: suggestion.title,
          description: suggestion.description || "",
          status: "next",
          is_public: true,
          sort_order: items.length + 1,
          source_suggestion_id: suggestion.id,
          cta_label: "",
          cta_url: "",
        },
      });
      setReviewingId(null);
      setAdminNote("");
      setMessage("Suggestion promoted to the public roadmap.");
      await loadData();
    } catch (err) {
      setError(errorMessage(err, "Could not approve suggestion."));
    }
  };

  const rejectSuggestion = async (suggestion: FeatureSuggestion) => {
    setMessage("");
    setError("");
    try {
      await rejectFeatureSuggestion(suggestion.id, { admin_note: adminNote || null });
      setReviewingId(null);
      setAdminNote("");
      setMessage("Suggestion rejected.");
      await loadData();
    } catch (err) {
      setError(errorMessage(err, "Could not reject suggestion."));
    }
  };

  if (loading) return <div className="text-zinc-400">Loading roadmap...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-red-500">
            Product Planning
          </p>
          <h2 className="text-3xl font-bold tracking-tight">Roadmap</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Publish roadmap items and review member feature suggestions before they appear publicly.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-300">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4 text-emerald-300">{message}</div>
      ) : null}

      <form onSubmit={saveItem} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{editingId ? "Edit Roadmap Item" : "Create Roadmap Item"}</h3>
            <p className="text-sm text-zinc-500">Only public items show on `/roadmap`.</p>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={resetDraft}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_12rem_10rem_10rem]">
          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Title
            <input
              value={draft.title}
              maxLength={120}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-red-500"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Status
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value as RoadmapStatus })}
              className="admin-filter-control admin-filter-select"
            >
              {ROADMAP_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Sort
            <input
              type="number"
              value={draft.sort_order}
              onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value) || 0 })}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-red-500"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Visibility
            <button
              type="button"
              onClick={() => setDraft({ ...draft, is_public: !draft.is_public })}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${draft.is_public ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200" : "border-zinc-700 bg-zinc-950 text-zinc-300"}`}
            >
              {draft.is_public ? <Eye size={16} /> : <EyeOff size={16} />}
              {draft.is_public ? "Public" : "Hidden"}
            </button>
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-2 text-sm text-zinc-300">
          Description
          <textarea
            value={draft.description || ""}
            maxLength={1200}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            className="min-h-24 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-red-500"
          />
        </label>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Optional Button Text
            <input
              value={draft.cta_label || ""}
              maxLength={80}
              onChange={(event) => setDraft({ ...draft, cta_label: event.target.value })}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-red-500"
              placeholder="Read the post"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Optional Button Link
            <input
              value={draft.cta_url || ""}
              maxLength={500}
              onChange={(event) => setDraft({ ...draft, cta_url: event.target.value })}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-red-500"
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            <Plus size={16} />
            {editingId ? "Save Item" : "Create Item"}
          </button>
        </div>
      </form>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4 border-b border-zinc-800/50 pb-4">
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-widest text-zinc-500">
              Published Board
            </p>
            <h3 className="text-2xl font-black tracking-tighter text-white">Roadmap Items</h3>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {items.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 text-zinc-400">
              No roadmap items yet.
            </div>
          ) : null}
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-zinc-500">Sort {item.sort_order}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => void togglePublic(item)}
                    className={`rounded border px-3 py-1 text-xs font-bold uppercase tracking-wider ${item.is_public ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200" : "border-zinc-700 bg-zinc-950 text-zinc-400"}`}
                  >
                    {item.is_public ? "Public" : "Hidden"}
                  </button>
                </div>
              </div>
              {item.description ? <p className="mb-4 text-sm leading-6 text-zinc-400">{item.description}</p> : null}
              {item.cta_label && item.cta_url ? (
                <a
                  href={item.cta_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-4 inline-flex items-center gap-2 rounded border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
                >
                  {item.cta_label}
                  <ExternalLink size={14} />
                </a>
              ) : null}
              <div>
                <button
                  type="button"
                  onClick={() => startEditing(item)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
                >
                  Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-widest text-zinc-500">
              Member Queue
            </p>
            <h3 className="text-2xl font-black tracking-tighter text-white">Feature Suggestions</h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter suggestions..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-red-500"
              />
            </label>
            <select
              value={suggestionStatus}
              onChange={(event) => setSuggestionStatus(event.target.value as SuggestionStatus | "all")}
              className="admin-filter-control admin-filter-select sm:w-44"
            >
              {SUGGESTION_FILTERS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {visibleSuggestions.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 text-zinc-400">
              No suggestions match this view.
            </div>
          ) : null}
          {visibleSuggestions.map((suggestion) => {
            const isReviewing = reviewingId === suggestion.id;
            return (
              <article key={suggestion.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white">{suggestion.title}</h4>
                    <p className="text-sm text-zinc-500">Suggested by {suggestion.username}</p>
                  </div>
                  <span className={`w-fit rounded border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusClass(suggestion.status)}`}>
                    {suggestion.status}
                  </span>
                </div>
                {suggestion.description ? <p className="mb-4 text-sm leading-6 text-zinc-400">{suggestion.description}</p> : null}
                {suggestion.admin_note ? (
                  <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-400">
                    {suggestion.admin_note}
                  </div>
                ) : null}
                {suggestion.status === "pending" ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setReviewingId(isReviewing ? null : suggestion.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                      >
                        <CheckCircle size={16} />
                        Review
                      </button>
                    </div>
                    {isReviewing ? (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                        <label className="mb-3 block text-sm text-zinc-300">
                          Admin note
                          <textarea
                            value={adminNote}
                            onChange={(event) => setAdminNote(event.target.value)}
                            className="mt-2 min-h-20 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-red-500"
                          />
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => void promoteSuggestion(suggestion)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                          >
                            <CheckCircle size={16} />
                            Approve & Publish
                          </button>
                          <button
                            type="button"
                            onClick={() => void rejectSuggestion(suggestion)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-950/30"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
