import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, Film, Search, XCircle } from "lucide-react";

import { MovieStagingScreen } from "./MovieStagingScreen";

const API_URL = import.meta.env.VITE_API_URL || "";

type RequestStatus = "all" | "pending" | "approved" | "rejected";

type AdminMovieRequest = {
  id: number;
  tmdb_id: number;
  status: "pending" | "approved" | "rejected";
  movie_id?: number | null;
  title: string;
  release_date?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  admin_reason?: string | null;
  supporter_count: number;
  supporters: {
    id: number;
    user_id: number;
    username: string;
    note?: string | null;
    created_at?: string | null;
  }[];
};

function releaseYear(value?: string | null) {
  return value ? value.substring(0, 4) : "Unknown year";
}

function imageUrl(path?: string | null) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : null;
}

function statusClass(status: AdminMovieRequest["status"]) {
  if (status === "approved") return "border-green-500/40 bg-green-950/30 text-green-200";
  if (status === "rejected") return "border-red-500/40 bg-red-950/30 text-red-200";
  return "border-amber-500/40 bg-amber-950/30 text-amber-200";
}

export function MovieRequestsTab() {
  const [requests, setRequests] = useState<AdminMovieRequest[]>([]);
  const [status, setStatus] = useState<RequestStatus>("pending");
  const [filter, setFilter] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<AdminMovieRequest | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/api/v1/admin/movie-requests?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRequests(res.data);
  };

  useEffect(() => {
    const loadRequests = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/v1/admin/movie-requests?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    };
    void loadRequests();
  }, [status]);

  const rejectRequest = async (requestId: number) => {
    const token = localStorage.getItem("token");
    await axios.post(
      `${API_URL}/api/v1/admin/movie-requests/${requestId}/reject`,
      { reason: rejectReason || null },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setRejectingId(null);
    setRejectReason("");
    await fetchRequests();
  };

  if (selectedRequest) {
    return (
      <MovieStagingScreen
        tmdbId={selectedRequest.tmdb_id}
        requestId={selectedRequest.id}
        onBack={() => {
          setSelectedRequest(null);
          void fetchRequests();
        }}
      />
    );
  }

  const visibleRequests = requests.filter((request) => {
    const q = filter.toLowerCase();
    if (!q) return true;
    return (
      request.title.toLowerCase().includes(q) ||
      request.supporters.some((supporter) => supporter.username.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-red-500">
            Community Queue
          </p>
          <h2 className="text-3xl font-bold tracking-tight">Movie Requests</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Review requested movies, inspect user notes, and import approved picks with curated artwork.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter requests..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-red-500"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as RequestStatus)}
            className="admin-filter-control admin-filter-select sm:w-44"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {visibleRequests.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
            No requests match this view.
          </div>
        ) : null}
        {visibleRequests.map((request) => {
          const image = imageUrl(request.poster_path);
          const isRejecting = rejectingId === request.id;
          return (
            <article
              key={request.id}
              className="grid overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 lg:grid-cols-[10rem_1fr]"
            >
              <div className="flex min-h-48 items-center justify-center bg-zinc-800">
                {image ? (
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Film size={28} className="text-zinc-500" />
                )}
              </div>
              <div className="p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{request.title}</h3>
                    <p className="text-sm text-zinc-500">
                      {releaseYear(request.release_date)} • TMDB {request.tmdb_id} • {request.supporter_count} requester{request.supporter_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className={`w-fit rounded border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusClass(request.status)}`}>
                    {request.status}
                  </span>
                </div>

                {request.overview ? (
                  <p className="mb-4 line-clamp-2 text-sm text-zinc-400">{request.overview}</p>
                ) : null}

                <div className="mb-4 space-y-2">
                  {request.supporters.map((supporter) => (
                    <div key={supporter.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                      <p className="text-sm font-bold text-zinc-200">{supporter.username}</p>
                      <p className="mt-1 text-sm text-zinc-500">{supporter.note || "No note added."}</p>
                    </div>
                  ))}
                </div>

                {request.admin_reason ? (
                  <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-200">
                    {request.admin_reason}
                  </div>
                ) : null}

                {request.status === "pending" ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
                    >
                      <CheckCircle size={16} />
                      Approve & Import
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingId(isRejecting ? null : request.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-bold text-red-200 transition-colors hover:bg-red-950/30"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                ) : null}

                {isRejecting ? (
                  <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Optional reason
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      className="mb-3 min-h-20 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => void rejectRequest(request.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
