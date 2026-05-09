import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ExternalLink, Film, Search, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { apiGet, apiPost } from "../lib/api";

type SearchMovie = {
  type: "movie";
  id: number;
  tmdb_id?: number | null;
  title: string;
  release_date?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  drop_id?: number | null;
  path?: string | null;
};

type TmdbMovie = {
  type: "tmdb_movie";
  tmdb_id: number;
  title: string;
  release_date?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  imported_movie_id?: number | null;
  imported_drop_id?: number | null;
  imported_path?: string | null;
  request_id?: number | null;
  request_status?: string | null;
  user_has_requested?: boolean;
  requestable: boolean;
};

type SiteResult = {
  title: string;
  description: string;
  path: string;
};

type SearchResponse = {
  query: string;
  site: SiteResult[];
  movies: SearchMovie[];
  tmdb: TmdbMovie[];
  suggestions?: string[];
};

type SearchOverlayProps = {
  onClose: () => void;
};

function releaseYear(value?: string | null) {
  return value ? value.substring(0, 4) : "Unknown year";
}

function imageUrl(path?: string | null, size = "w342") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
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

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [requestingTmdbId, setRequestingTmdbId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchSequence = useRef(0);
  const tmdbSequence = useRef(0);
  const localOnlyBlockedUntil = useRef(0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const performSearch = async (nextQuery: string, includeTmdb = false) => {
    if (!includeTmdb && Date.now() < localOnlyBlockedUntil.current) return;
    const trimmed = nextQuery.trim();
    const sequence = searchSequence.current + 1;
    searchSequence.current = sequence;

    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      setTmdbLoading(false);
      setError(null);
      return;
    }

    if (includeTmdb) {
      setTmdbLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const hasToken = Boolean(localStorage.getItem("token"));
      const data = await apiGet<SearchResponse>(
        `/api/v1/search?query=${encodeURIComponent(trimmed)}&include_tmdb=${includeTmdb ? "true" : "false"}`,
        hasToken,
      );
      if (sequence === searchSequence.current) {
        setResults({
          ...data,
          tmdb: includeTmdb ? data.tmdb : [],
        });
      }
    } catch (err) {
      console.error(err);
      if (sequence === searchSequence.current) {
        setError("Search is unavailable right now.");
      }
    } finally {
      if (sequence === searchSequence.current) {
        if (includeTmdb) {
          setTmdbLoading(false);
        } else {
          setLoading(false);
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

  const runSearch = (event: FormEvent) => {
    event.preventDefault();
    localOnlyBlockedUntil.current = Date.now() + 700;
    void performSearch(query, true);
  };

  const navigateAndClose = (path: string) => {
    onClose();
    navigate(path);
  };

  const useSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    localOnlyBlockedUntil.current = Date.now() + 700;
    void performSearch(suggestion, true);
  };

  const requestMovie = async (movie: TmdbMovie) => {
    if (!user) {
      login();
      return;
    }
    setRequestingTmdbId(movie.tmdb_id);
    setError(null);
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
      navigateAndClose("/requests");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not request that movie."));
    } finally {
      setRequestingTmdbId(null);
    }
  };

  const hasResults =
    Boolean(results?.site.length) ||
    Boolean(results?.movies.length) ||
    Boolean(results?.tmdb.length);
  const heroMovie = results?.movies[0] || results?.tmdb[0] || null;
  const heroImage = imageUrl(heroMovie?.backdrop_path || heroMovie?.poster_path, "w1280");

  return (
    <div className="fixed inset-0 z-[80] h-dvh overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0">
        {heroImage ? (
          <img src={heroImage} alt="" className="h-full w-full object-cover opacity-20 blur-sm" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.25),transparent_40rem)]" />
      </div>

      <div className="relative mx-auto flex h-dvh max-w-6xl flex-col px-4 py-5 sm:px-6 md:py-8">
        <div className="mb-6 flex shrink-0 items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-red-500">
              Search
            </p>
            <h2 className="text-3xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl">
              Reel Review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-3 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={runSearch} className="relative mb-4 shrink-0">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={24} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Start typing a movie, page, or request..."
            className="w-full rounded-xl border border-white/10 bg-zinc-950/80 py-5 pl-14 pr-12 text-lg text-white outline-none backdrop-blur transition-colors focus:border-red-500 sm:pr-32 sm:text-xl font-medium tracking-wide"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition-transform duration-300 hover:scale-105 hover:bg-red-700 sm:block"
          >
            Search
          </button>
        </form>

        <div className="mb-4 min-h-6 shrink-0">
          {loading ? (
            <p className="text-sm text-zinc-500">Searching as you type...</p>
          ) : tmdbLoading ? (
            <p className="text-sm text-zinc-500">Checking TMDB...</p>
          ) : results?.suggestions?.length ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <span>Did you mean</span>
              {results.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => useSuggestion(suggestion)}
                  className="font-bold text-zinc-200 transition-colors hover:text-red-400"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : query.trim().length === 1 ? (
            <p className="text-sm text-zinc-500">Keep typing for live suggestions.</p>
          ) : null}
        </div>

        {error ? (
          <div className="mb-4 shrink-0 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10 pr-1">
          {!loading && results && !hasResults ? (
            <div className="border-y border-zinc-800 py-8 text-zinc-400">
              No results found. Try another title or check the dedicated request page.
            </div>
          ) : null}

          {results?.site.length ? (
            <section className="mb-10">
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-500">
                Site
              </h3>
              <div className="divide-y divide-zinc-800/50 border-y border-zinc-800/50">
                {results.site.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigateAndClose(item.path)}
                    className="group flex w-full items-center justify-between gap-4 py-5 text-left transition-colors duration-300 hover:bg-zinc-900/50 px-3 -mx-3 rounded-xl"
                  >
                    <span>
                      <span className="block text-lg font-bold text-white group-hover:text-red-400 transition-colors">{item.title}</span>
                      <span className="mt-1 block text-sm text-zinc-500">{item.description}</span>
                    </span>
                    <ArrowRight size={20} className="shrink-0 text-zinc-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-red-500" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {results?.movies.length ? (
            <section className="mb-10">
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-500">
                On Reel Review
              </h3>
              <div className="divide-y divide-zinc-800/50 border-y border-zinc-800/50">
                {results.movies.map((movie) => {
                  const image = imageUrl(movie.backdrop_path || movie.poster_path, movie.backdrop_path ? "w342" : "w154");
                  return (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => movie.path && navigateAndClose(movie.path)}
                      className="group grid w-full grid-cols-[6.5rem_1fr_auto] items-center gap-5 py-4 text-left transition-colors duration-300 hover:bg-zinc-900/50 px-3 -mx-3 rounded-xl border border-transparent hover:border-zinc-800/50"
                    >
                      <div className="h-16 overflow-hidden rounded bg-zinc-900 sm:h-24">
                        {image ? (
                          <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-600 transition-transform duration-500 group-hover:scale-110">
                            <Film size={24} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">{movie.title}</p>
                        <p className="text-sm font-medium tracking-wide text-zinc-500">{releaseYear(movie.release_date)}</p>
                        {movie.overview ? (
                          <p className="mt-1.5 line-clamp-1 text-sm text-zinc-400">{movie.overview}</p>
                        ) : null}
                      </div>
                      <ExternalLink size={20} className="text-zinc-600 transition-colors duration-300 group-hover:text-red-500" />
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {results?.tmdb.length ? (
            <section>
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-zinc-500">
                Request From TMDB
              </h3>
              <div className="divide-y divide-zinc-800/50 border-y border-zinc-800/50">
                {results.tmdb.map((movie) => {
                  const image = imageUrl(movie.backdrop_path || movie.poster_path, movie.backdrop_path ? "w342" : "w154");
                  const alreadyImported = Boolean(movie.imported_movie_id);
                  return (
                    <div
                      key={movie.tmdb_id}
                      className="group grid gap-5 py-4 sm:grid-cols-[6.5rem_1fr_auto] sm:items-center px-3 -mx-3 transition-colors duration-300 hover:bg-zinc-900/30 rounded-xl"
                    >
                      <div className="hidden h-24 overflow-hidden rounded bg-zinc-900 sm:block">
                        {image ? (
                          <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-600 transition-transform duration-500 group-hover:scale-110">
                            <Film size={24} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">{movie.title}</p>
                        <p className="text-sm font-medium tracking-wide text-zinc-500">{releaseYear(movie.release_date)}</p>
                        {movie.overview ? (
                          <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">{movie.overview}</p>
                        ) : null}
                      </div>
                      {alreadyImported ? (
                        <button
                          type="button"
                          onClick={() => movie.imported_path && navigateAndClose(movie.imported_path)}
                          disabled={!movie.imported_path}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-bold text-zinc-200 transition-colors hover:bg-white/10"
                        >
                          <ExternalLink size={18} />
                          Open
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={requestingTmdbId === movie.tmdb_id || movie.user_has_requested}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-red-700 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-red-950/20"
                          onClick={() => void requestMovie(movie)}
                        >
                          <Send size={18} />
                          {movie.user_has_requested
                            ? "Requested"
                            : requestingTmdbId === movie.tmdb_id
                              ? "Requesting..."
                              : "Request"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
