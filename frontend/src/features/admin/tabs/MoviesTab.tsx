import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Filter, X } from "lucide-react";
import { MovieStagingScreen } from "./MovieStagingScreen";
import { MovieAnalyticsView } from "./MovieAnalyticsView";
import { KanbanColumn } from "../components/KanbanColumn";

const API_URL = import.meta.env.VITE_API_URL || "";

type Genre = {
  id?: number | null;
  name: string;
};

type AdminMovie = {
  id: number;
  title: string;
  tmdb_id?: number | null;
  release_date?: string | null;
  created_at?: string | null;
  poster_path?: string | null;
  in_pool?: boolean;
  genres?: Genre[];
  average_score?: number | null;
  total_ratings?: number;
};

type DropSummary = {
  movie_id?: number | null;
  start_date?: string | null;
};

type MovieFilters = {
  releaseFrom: string;
  releaseTo: string;
  importedFrom: string;
  importedTo: string;
  genre: string;
  ratingMin: string;
  ratingMax: string;
  ratingsCountMin: string;
  status: "all" | "unscheduled" | "pool" | "scheduled";
  sort: "dropOrder" | "newest" | "title" | "ratingDesc" | "ratingAsc" | "releaseDesc" | "releaseAsc";
};

const DEFAULT_MOVIE_FILTERS: MovieFilters = {
  releaseFrom: "",
  releaseTo: "",
  importedFrom: "",
  importedTo: "",
  genre: "all",
  ratingMin: "",
  ratingMax: "",
  ratingsCountMin: "",
  status: "all",
  sort: "dropOrder",
};

function parseDateValue(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inDateRange(value: string | null | undefined, from: string, to: string) {
  const date = parseDateValue(value);
  if (!date && (from || to)) return false;
  if (!date) return true;
  if (from && date < new Date(`${from}T00:00:00`)) return false;
  if (to && date > new Date(`${to}T23:59:59`)) return false;
  return true;
}

function getMovieStatus(movie: AdminMovie, scheduledMovieIds: Set<number>) {
  if (scheduledMovieIds.has(movie.id)) return "scheduled";
  if (movie.in_pool) return "pool";
  return "unscheduled";
}

function countActiveMovieFilters(filters: MovieFilters) {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === "sort") return value !== DEFAULT_MOVIE_FILTERS.sort;
    return value !== DEFAULT_MOVIE_FILTERS[key as keyof MovieFilters];
  }).length;
}

export function MoviesTab() {
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);

  const [importedMovies, setImportedMovies] = useState<AdminMovie[]>([]);
  const [drops, setDrops] = useState<DropSummary[]>([]);
  const [kanbanFilter, setKanbanFilter] = useState("");
  const [movieFilters, setMovieFilters] = useState<MovieFilters>(DEFAULT_MOVIE_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedAnalyticsMovieId, setSelectedAnalyticsMovieId] = useState<number | null>(null);

  const fetchImportedMovies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/v1/admin/movies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImportedMovies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDrops = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/v1/admin/drops`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrops(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!selectedTmdbId) {
      fetchImportedMovies();
      fetchDrops();
    }
  }, [selectedTmdbId]);

  const scheduledMovieIds = useMemo(
    () => new Set(drops.map((d) => d.movie_id).filter((id): id is number => Boolean(id))),
    [drops],
  );

  const dropOrderByMovieId = useMemo(() => {
    const order = new Map<number, number>();
    drops.forEach((drop) => {
      if (!drop.movie_id || !drop.start_date) return;
      const startTime = parseDateValue(drop.start_date)?.getTime();
      if (startTime === undefined) return;
      const existing = order.get(drop.movie_id);
      if (existing === undefined || startTime > existing) {
        order.set(drop.movie_id, startTime);
      }
    });
    return order;
  }, [drops]);

  const genreOptions = useMemo(() => {
    const genres = new Set<string>();
    importedMovies.forEach((movie) => {
      movie.genres?.forEach((genre) => {
        if (genre.name) genres.add(genre.name);
      });
    });
    return Array.from(genres).sort((a, b) => a.localeCompare(b));
  }, [importedMovies]);

  const filteredMovies = useMemo(() => {
    const q = kanbanFilter.toLowerCase();
    const minRating = movieFilters.ratingMin === "" ? null : Number(movieFilters.ratingMin);
    const maxRating = movieFilters.ratingMax === "" ? null : Number(movieFilters.ratingMax);
    const minRatingsCount =
      movieFilters.ratingsCountMin === "" ? null : Number(movieFilters.ratingsCountMin);

    const nextMovies = importedMovies.filter((movie) => {
      if (q && !movie.title.toLowerCase().includes(q)) return false;
      if (!inDateRange(movie.release_date, movieFilters.releaseFrom, movieFilters.releaseTo)) return false;
      if (!inDateRange(movie.created_at, movieFilters.importedFrom, movieFilters.importedTo)) return false;
      if (
        movieFilters.genre !== "all" &&
        !movie.genres?.some((genre) => genre.name === movieFilters.genre)
      ) {
        return false;
      }
      if (movieFilters.status !== "all" && getMovieStatus(movie, scheduledMovieIds) !== movieFilters.status) {
        return false;
      }

      const averageScore = movie.average_score;
      if (minRating !== null && (averageScore === null || averageScore === undefined || averageScore < minRating)) {
        return false;
      }
      if (maxRating !== null && (averageScore === null || averageScore === undefined || averageScore > maxRating)) {
        return false;
      }
      if (minRatingsCount !== null && (movie.total_ratings ?? 0) < minRatingsCount) {
        return false;
      }
      return true;
    });

    return [...nextMovies].sort((a, b) => {
      switch (movieFilters.sort) {
        case "dropOrder": {
          const aDropTime = dropOrderByMovieId.get(a.id);
          const bDropTime = dropOrderByMovieId.get(b.id);
          if (aDropTime !== undefined && bDropTime !== undefined) return bDropTime - aDropTime;
          if (aDropTime !== undefined) return -1;
          if (bDropTime !== undefined) return 1;
          return a.title.localeCompare(b.title);
        }
        case "title":
          return a.title.localeCompare(b.title);
        case "ratingDesc":
          return (b.average_score ?? -1) - (a.average_score ?? -1);
        case "ratingAsc":
          return (a.average_score ?? 101) - (b.average_score ?? 101);
        case "releaseDesc":
          return (parseDateValue(b.release_date)?.getTime() ?? 0) - (parseDateValue(a.release_date)?.getTime() ?? 0);
        case "releaseAsc":
          return (parseDateValue(a.release_date)?.getTime() ?? 0) - (parseDateValue(b.release_date)?.getTime() ?? 0);
        case "newest":
        default:
          return (parseDateValue(b.created_at)?.getTime() ?? b.id) - (parseDateValue(a.created_at)?.getTime() ?? a.id);
      }
    });
  }, [dropOrderByMovieId, importedMovies, kanbanFilter, movieFilters, scheduledMovieIds]);

  const activeMovieFilterCount = countActiveMovieFilters(movieFilters);

  const unscheduledMovies = useMemo(
    () =>
      filteredMovies.filter((m) => !m.in_pool && !scheduledMovieIds.has(m.id)),
    [filteredMovies, scheduledMovieIds],
  );
  const poolMovies = useMemo(
    () =>
      filteredMovies.filter((m) => m.in_pool && !scheduledMovieIds.has(m.id)),
    [filteredMovies, scheduledMovieIds],
  );
  const scheduledMovies = useMemo(
    () => filteredMovies.filter((m) => scheduledMovieIds.has(m.id)),
    [filteredMovies, scheduledMovieIds],
  );

  const handleTmdbSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbSearchQuery) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/api/v1/admin/tmdb/search?query=${tmdbSearchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setTmdbSearchResults(res.data.results || []);
      setSelectedTmdbId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (
      !window.confirm(
        `Permanently delete "${title}"? This removes all related drops and ratings.`,
      )
    )
      return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/v1/admin/movies/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchImportedMovies();
      fetchDrops();
    } catch (err: any) {
      alert(`Error deleting: ${err.response?.data?.detail || err.message}`);
    }
  };

  const togglePool = async (movieId: number, inPool: boolean) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/v1/admin/movies/${movieId}/pool`,
        { in_pool: inPool },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchImportedMovies();
    } catch (err: any) {
      alert(
        `Error updating pool: ${err.response?.data?.detail || err.message}`,
      );
    }
  };

  const handleDropToUnscheduled = (movie: AdminMovie) => {
    if (movie.in_pool) {
      togglePool(movie.id, false);
    }
  };

  const handleDropToPool = (movie: AdminMovie) => {
    if (!movie.in_pool) {
      togglePool(movie.id, true);
    }
  };

  const handleDropToScheduled = (movie: AdminMovie) => {
    alert(
      `To schedule "${movie.title}", use the Weekly Drops calendar tab to assign it to a specific week.`,
    );
  };

  if (selectedTmdbId) {
    return (
      <MovieStagingScreen
        tmdbId={selectedTmdbId}
        onBack={() => {
          setSelectedTmdbId(null);
          fetchImportedMovies();
        }}
      />
    );
  }

  if (selectedAnalyticsMovieId) {
    return (
      <MovieAnalyticsView
        movieId={selectedAnalyticsMovieId}
        onBack={() => setSelectedAnalyticsMovieId(null)}
      />
    );
  }

  return (
    <div>
      {/* TMDB Import Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Import from TMDB</h2>
        <form
          onSubmit={handleTmdbSearch}
          className="mb-6 flex flex-col md:flex-row gap-4"
        >
          <input
            type="text"
            value={tmdbSearchQuery}
            onChange={(e) => setTmdbSearchQuery(e.target.value)}
            placeholder="Search TMDB for a movie to import..."
            className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="submit"
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Search
          </button>
        </form>

        {tmdbSearchResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {tmdbSearchResults.map((movie) => (
              <div
                key={movie.id}
                className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 group cursor-pointer hover:border-red-500 transition-colors"
                onClick={() => setSelectedTmdbId(movie.id)}
              >
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover group-hover:opacity-75 transition-opacity"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center p-4 text-center text-sm text-zinc-500">
                    No Poster
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-white text-sm line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {movie.release_date?.substring(0, 4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 mb-8" />

      {/* Kanban Board */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold">Movie Database</h2>
            <p className="text-sm text-zinc-500">
              Drag and drop movies between zones to manage their status.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center">
            <div className="relative w-full sm:w-72">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="m21 21-4.35-4.35"
                />
              </svg>
              <input
                type="text"
                value={kanbanFilter}
                onChange={(e) => setKanbanFilter(e.target.value)}
                placeholder="Filter movies..."
                className="w-full bg-zinc-900 border border-zinc-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterOpen((open) => !open)}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors sm:w-auto ${
                  filterOpen || activeMovieFilterCount > 0
                    ? "border-red-500/50 bg-red-600 text-white"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Filter size={16} />
                Filters
                {activeMovieFilterCount > 0 ? (
                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-black">
                    {activeMovieFilterCount}
                  </span>
                ) : null}
              </button>

              {filterOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/40 sm:w-[420px]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">Movie Filters</p>
                    <p className="text-xs text-zinc-500">Narrow the database without crowding the board.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"
                    aria-label="Close movie filters"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Release From
                    <input
                      type="date"
                      value={movieFilters.releaseFrom}
                      onChange={(e) => setMovieFilters((filters) => ({ ...filters, releaseFrom: e.target.value }))}
                      className="admin-filter-control admin-filter-date"
                    />
                  </label>
                  <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Release To
                    <input
                      type="date"
                      value={movieFilters.releaseTo}
                      onChange={(e) => setMovieFilters((filters) => ({ ...filters, releaseTo: e.target.value }))}
                      className="admin-filter-control admin-filter-date"
                    />
                  </label>
                  <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Imported From
                    <input
                      type="date"
                      value={movieFilters.importedFrom}
                      onChange={(e) => setMovieFilters((filters) => ({ ...filters, importedFrom: e.target.value }))}
                      className="admin-filter-control admin-filter-date"
                    />
                  </label>
                  <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Imported To
                    <input
                      type="date"
                      value={movieFilters.importedTo}
                      onChange={(e) => setMovieFilters((filters) => ({ ...filters, importedTo: e.target.value }))}
                      className="admin-filter-control admin-filter-date"
                    />
                  </label>
                  <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Genre
                    <select
                      value={movieFilters.genre}
                      onChange={(e) => setMovieFilters((filters) => ({ ...filters, genre: e.target.value }))}
                      className="admin-filter-control admin-filter-select"
                    >
                      <option value="all">All genres</option>
                      {genreOptions.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Status
                    <select
                      value={movieFilters.status}
                      onChange={(e) => setMovieFilters((filters) => ({ ...filters, status: e.target.value as MovieFilters["status"] }))}
                      className="admin-filter-control admin-filter-select"
                    >
                      <option value="all">All statuses</option>
                      <option value="unscheduled">Unscheduled</option>
                      <option value="pool">The Pool</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Min Average
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={movieFilters.ratingMin}
                      onChange={(e) => setMovieFilters((filters) => ({ ...filters, ratingMin: e.target.value }))}
                      placeholder="0"
                      className="admin-filter-control"
                    />
                  </label>
                  <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Max Average
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={movieFilters.ratingMax}
                      onChange={(e) => setMovieFilters((filters) => ({ ...filters, ratingMax: e.target.value }))}
                      placeholder="100"
                      className="admin-filter-control"
                    />
                  </label>
                  <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Min Ratings
                    <input
                      type="number"
                      min="0"
                      value={movieFilters.ratingsCountMin}
                      onChange={(e) => setMovieFilters((filters) => ({ ...filters, ratingsCountMin: e.target.value }))}
                      placeholder="0"
                      className="admin-filter-control"
                    />
                  </label>
                  <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Sort
                    <select
                      value={movieFilters.sort}
                      onChange={(e) => setMovieFilters((filters) => ({ ...filters, sort: e.target.value as MovieFilters["sort"] }))}
                      className="admin-filter-control admin-filter-select"
                    >
                      <option value="dropOrder">Drop order</option>
                      <option value="newest">Newest imported</option>
                      <option value="title">Title A-Z</option>
                      <option value="ratingDesc">Rating high to low</option>
                      <option value="ratingAsc">Rating low to high</option>
                      <option value="releaseDesc">Release newest</option>
                      <option value="releaseAsc">Release oldest</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
                  <p className="text-xs text-zinc-500">{filteredMovies.length} movies match</p>
                  <button
                    type="button"
                    onClick={() => setMovieFilters(DEFAULT_MOVIE_FILTERS)}
                    className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <KanbanColumn
            title="Unscheduled"
            subtitle="Movies in the database not yet assigned anywhere"
            accentColor="zinc"
            movies={unscheduledMovies}
            onDrop={handleDropToUnscheduled}
            onDeleteMovie={handleDelete}
            onSelectMovie={(movie) => setSelectedAnalyticsMovieId(movie.id)}
            emptyMessage="No unscheduled movies. Import some from TMDB above!"
            compact
          />
          <KanbanColumn
            title="The Pool"
            subtitle="Available for random draws & community voting"
            accentColor="amber"
            movies={poolMovies}
            onDrop={handleDropToPool}
            onDeleteMovie={handleDelete}
            onSelectMovie={(movie) => setSelectedAnalyticsMovieId(movie.id)}
            emptyMessage="Drag movies here to add them to the selection pool"
            compact
          />
          <KanbanColumn
            title="Scheduled"
            subtitle="Assigned to a specific week on the calendar"
            accentColor="red"
            movies={scheduledMovies}
            onDrop={handleDropToScheduled}
            onSelectMovie={(movie) => setSelectedAnalyticsMovieId(movie.id)}
            emptyMessage="Schedule movies from the Weekly Drops tab"
            compact
          />
        </div>
      </div>
    </div>
  );
}
