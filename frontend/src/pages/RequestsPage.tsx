import { useEffect, useRef, useState, type FormEvent } from "react";
import { Edit3, Film, Save, Search, Send, Trash2, X } from "lucide-react";
import { Navigate } from "react-router-dom";

import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { useAuth } from "../context/AuthContext";
import { apiDelete, apiGet, apiPatch, apiPost } from "../lib/api";

type TmdbMovie = {
  type: "tmdb_movie";
  tmdb_id: number;
  title: string;
  release_date?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  imported_movie_id?: number | null;
  user_has_requested?: boolean;
};

type SearchResponse = {
  tmdb: TmdbMovie[];
  suggestions?: string[];
};

type MovieRequest = {
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
  user_note?: string | null;
  can_edit: boolean;
  can_delete: boolean;
};

function releaseYear(value?: string | null) {
  return value ? value.substring(0, 4) : "Unknown year";
}

function imageUrl(path?: string | null, size = "w342") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

function statusClasses(status: MovieRequest["status"]) {
  if (status === "approved") return "border-green-500/40 bg-green-950/30 text-green-200";
  if (status === "rejected") return "border-red-500/40 bg-red-950/30 text-red-200";
  return "border-amber-500/40 bg-amber-950/30 text-amber-200";
}

function getErrorMessage(error: unknown, fallback: string) {
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

export default function RequestsPage() {
  const { user, loading, login } = useAuth();
  const [requests, setRequests] = useState<MovieRequest[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TmdbMovie[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const searchSequence = useRef(0);
  const tmdbSequence = useRef(0);
  const localOnlyBlockedUntil = useRef(0);

  const fetchRequests = async () => {
    const data = await apiGet<MovieRequest[]>("/api/v1/movie-requests", true);
    setRequests(data);
  };

  useEffect(() => {
    if (user) {
      const loadRequests = async () => {
        const data = await apiGet<MovieRequest[]>("/api/v1/movie-requests", true);
        setRequests(data);
      };
      void loadRequests();
    }
  }, [user]);

  const performSearch = async (nextQuery: string, includeTmdb = false) => {
    if (!includeTmdb && Date.now() < localOnlyBlockedUntil.current) return;
    const trimmed = nextQuery.trim();
    const sequence = searchSequence.current + 1;
    searchSequence.current = sequence;
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSuggestions([]);
      setSearching(false);
      setTmdbLoading(false);
      return;
    }
    if (includeTmdb) {
      setTmdbLoading(true);
    } else {
      setSearching(true);
    }
    setMessage(null);
    try {
      const data = await apiGet<SearchResponse>(
        `/api/v1/search?query=${encodeURIComponent(trimmed)}&include_tmdb=${includeTmdb ? "true" : "false"}`,
        true,
      );
      if (sequence === searchSequence.current) {
        setSearchResults(
          includeTmdb ? data.tmdb.filter((movie) => !movie.imported_movie_id) : [],
        );
        setSuggestions(data.suggestions || []);
      }
    } catch (err: unknown) {
      if (sequence === searchSequence.current) {
        setMessage(getErrorMessage(err, "Search failed."));
      }
    } finally {
      if (sequence === searchSequence.current) {
        if (includeTmdb) {
          setTmdbLoading(false);
        } else {
          setSearching(false);
        }
      }
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void performSearch(query, false);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const trimmed = query.trim();
    const sequence = tmdbSequence.current + 1;
    tmdbSequence.current = sequence;
    if (trimmed.length < 3) return undefined;

    const timeout = window.setTimeout(() => {
      if (sequence === tmdbSequence.current) {
        void performSearch(trimmed, true);
      }
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [query]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-white" />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  const runSearch = (event: FormEvent) => {
    event.preventDefault();
    localOnlyBlockedUntil.current = Date.now() + 700;
    void performSearch(query, true);
  };

  const requestMovie = async (movie: TmdbMovie) => {
    try {
      await apiPost(
        "/api/v1/movie-requests",
        {
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          release_date: movie.release_date,
          overview: movie.overview,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
        },
        true,
      );
      setMessage(`${movie.title} was added to your requests.`);
      setSearchResults((results) =>
        results.map((item) =>
          item.tmdb_id === movie.tmdb_id ? { ...item, user_has_requested: true } : item,
        ),
      );
      await fetchRequests();
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Could not create request."));
    }
  };

  const saveNote = async (requestId: number) => {
    await apiPatch(`/api/v1/movie-requests/${requestId}`, { note: draftNote }, true);
    setEditingRequestId(null);
    setDraftNote("");
    await fetchRequests();
  };

  const deleteRequest = async (requestId: number, title: string) => {
    if (!window.confirm(`Delete your request for "${title}"?`)) return;
    await apiDelete(`/api/v1/movie-requests/${requestId}`, true);
    await fetchRequests();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SiteHeader activeSection={null} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <section className="relative -mx-4 mb-10 min-h-[48vh] overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.25),transparent_40rem)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          <div className="relative flex min-h-[48vh] max-w-4xl flex-col justify-end pb-10 pt-24">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-red-500">
              Movie Requests
            </p>
            <h1 className="mb-4 text-5xl font-black tracking-tighter leading-[1.05] sm:text-7xl">
              Put a film on the community radar.
            </h1>
            <p className="max-w-2xl text-lg text-zinc-300">
              Search as you type, request movies from TMDB, and track whether admins approve them for Reel Review.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <form onSubmit={runSearch} className="mb-6 flex flex-col gap-3 sm:flex-row shadow-xl">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={24} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for a movie to request..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 py-4 pl-14 pr-5 text-lg font-medium tracking-wide text-white outline-none transition-colors backdrop-blur focus:border-red-500 focus:bg-zinc-900"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-8 py-4 font-black tracking-wide text-white transition-all duration-300 hover:scale-105 hover:bg-red-700 shadow-md shadow-red-950/20"
            >
              <Search size={22} />
              {searching ? "Searching..." : "Search"}
            </button>
          </form>

          <div className="mb-5 min-h-6">
            {searching ? (
              <p className="text-sm text-zinc-500">Searching live...</p>
            ) : tmdbLoading ? (
              <p className="text-sm text-zinc-500">Checking TMDB...</p>
            ) : suggestions.length ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                <span>Did you mean</span>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuery(suggestion);
                      localOnlyBlockedUntil.current = Date.now() + 700;
                      void performSearch(suggestion, true);
                    }}
                    className="font-bold text-zinc-200 transition-colors hover:text-red-400"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : query.trim().length === 1 ? (
              <p className="text-sm text-zinc-500">Keep typing for suggestions.</p>
            ) : message ? (
              <p className="text-sm text-zinc-300">{message}</p>
            ) : null}
          </div>

          {searchResults.length ? (
            <div className="hide-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-6 scroll-smooth snap-x snap-mandatory">
              {searchResults.map((movie) => {
                const image = imageUrl(movie.backdrop_path || movie.poster_path, movie.backdrop_path ? "w780" : "w342");
                return (
                  <article
                    key={movie.tmdb_id}
                    className="group relative h-[21rem] w-[24rem] shrink-0 snap-start overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900 shadow-xl"
                  >
                    {image ? (
                      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-600 transition-transform duration-500 group-hover:scale-105">
                        <Film size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                      <h2 className="text-2xl font-black text-white leading-tight group-hover:text-red-400 transition-colors">{movie.title}</h2>
                      <p className="mt-1 text-sm font-medium tracking-wide text-zinc-400">{releaseYear(movie.release_date)}</p>
                      {movie.overview ? (
                        <p className="mt-2 line-clamp-2 text-sm text-zinc-300 opacity-80 group-hover:opacity-100 transition-opacity">{movie.overview}</p>
                      ) : null}
                      <button
                        type="button"
                        disabled={movie.user_has_requested}
                        onClick={() => void requestMovie(movie)}
                        className="mt-5 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-red-950/40 opacity-0 group-hover:opacity-100"
                      >
                        <Send size={18} />
                        {movie.user_has_requested ? "Requested" : "Request"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-zinc-800/50 pb-4">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-zinc-500">
                Your Queue
              </p>
              <h2 className="text-3xl font-black tracking-tighter text-white">Request Status</h2>
            </div>
            <button
              type="button"
              onClick={login}
              className="hidden rounded-lg border border-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300"
            >
              Refresh Login
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {requests.length === 0 ? (
              <div className="py-10 text-center text-lg text-zinc-500">
                No movie requests yet.
              </div>
            ) : null}
            {requests.map((request) => {
              const image = imageUrl(request.backdrop_path || request.poster_path, request.backdrop_path ? "w780" : "w342");
              const editing = editingRequestId === request.id;
              return (
                <article
                  key={request.id}
                  className="group grid gap-6 overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5 shadow-lg transition-colors hover:bg-zinc-900/70 md:grid-cols-[9rem_1fr_auto] md:items-start"
                >
                  <div className="hidden aspect-[2/3] w-36 overflow-hidden rounded bg-zinc-900 md:block relative shadow-md">
                    {image ? (
                      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-600 transition-transform duration-500 group-hover:scale-105">
                        <Film size={32} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pt-1">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">{request.title}</h3>
                        <p className="mt-1 text-sm font-medium tracking-wide text-zinc-400">
                          {releaseYear(request.release_date)} • <span className="text-zinc-500">{request.supporter_count} requester{request.supporter_count === 1 ? "" : "s"}</span>
                        </p>
                      </div>
                      <span className={`w-fit rounded-lg border px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-sm ${statusClasses(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    {request.admin_reason ? (
                      <p className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm font-medium text-red-200">
                        {request.admin_reason}
                      </p>
                    ) : null}
                    {editing ? (
                      <div className="space-y-3 mt-2">
                        <textarea
                          value={draftNote}
                          onChange={(event) => setDraftNote(event.target.value)}
                          className="min-h-[6rem] w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-base text-white outline-none focus:border-red-500 shadow-inner"
                          placeholder="Add a note for admins..."
                        />
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => void saveNote(request.id)}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-red-700 shadow-md shadow-red-950/20"
                          >
                            <Save size={18} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRequestId(null)}
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-5 py-2 text-sm font-bold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                          >
                            <X size={18} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-5 text-base text-zinc-300">
                        {request.user_note || "No note added."}
                      </p>
                    )}
                    {!editing && (request.can_edit || request.can_delete) ? (
                      <div className="flex flex-wrap gap-3 md:justify-end mt-auto pt-2">
                        {request.can_edit ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRequestId(request.id);
                              setDraftNote(request.user_note || "");
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
                          >
                            <Edit3 size={16} /> Edit Note
                          </button>
                        ) : null}
                        {request.can_delete ? (
                          <button
                            type="button"
                            onClick={() => void deleteRequest(request.id, request.title)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-950/30 hover:text-red-300"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
