import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  EyeOff,
  Filter,
  Film,
  MessageSquareText,
  Search,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SubCategoryRadar } from "../components/SubCategoryRadar";

const API_URL = import.meta.env.VITE_API_URL || "";

type Genre = {
  id?: number | null;
  name: string;
};

type MovieAnalytics = {
  movie: {
    id: number;
    title: string;
    tmdb_id: number | null;
    release_date: string | null;
    overview: string | null;
    director_name: string | null;
    poster_path: string | null;
    backdrop_path: string | null;
    genres: Genre[];
  };
  stats: {
    total_ratings: number;
    average_score: number | null;
    highest_score: number | null;
    lowest_score: number | null;
    median_score: number | null;
    score_spread: number;
    spoiler_review_count: number;
    text_review_count: number;
  };
  score_distribution: { score: number; count: number }[];
  subcategories: {
    key: string;
    subject: string;
    count: number;
    average_score: number | null;
  }[];
  ratings: {
    id: number;
    user_id: number;
    username: string;
    is_anonymous: boolean;
    overall_score: number;
    review_text: string | null;
    has_spoilers: boolean;
    is_late: boolean;
    weekly_drop_id: number | null;
    weekly_drop_start_date: string | null;
    weekly_drop_end_date: string | null;
    created_at: string | null;
    subcategories: Record<string, number | null>;
  }[];
};

interface MovieAnalyticsViewProps {
  movieId: number;
  onBack: () => void;
}

type ReviewFilters = {
  query: string;
  scoreMin: string;
  scoreMax: string;
  reviewedFrom: string;
  reviewedTo: string;
  dropFrom: string;
  dropTo: string;
  spoiler: "all" | "spoiler-free" | "spoilers";
  anonymous: "all" | "anonymous" | "named";
  late: "all" | "late" | "on-time";
  text: "all" | "with-text" | "no-text";
  sort: "recent" | "scoreDesc" | "scoreAsc" | "username";
};

const DEFAULT_REVIEW_FILTERS: ReviewFilters = {
  query: "",
  scoreMin: "",
  scoreMax: "",
  reviewedFrom: "",
  reviewedTo: "",
  dropFrom: "",
  dropTo: "",
  spoiler: "all",
  anonymous: "all",
  late: "all",
  text: "all",
  sort: "recent",
};

function imageUrl(path: string | null, size: string) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

function formatDate(value: string | null) {
  if (!value) return "Unscheduled";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scoreValue(value: number | null) {
  return value === null ? "--" : value;
}

function dateInRange(value: string | null, from: string, to: string) {
  if (!value && (from || to)) return false;
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (from && date < new Date(`${from}T00:00:00`)) return false;
  if (to && date > new Date(`${to}T23:59:59`)) return false;
  return true;
}

function countActiveReviewFilters(filters: ReviewFilters) {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === "sort") return value !== DEFAULT_REVIEW_FILTERS.sort;
    return value !== DEFAULT_REVIEW_FILTERS[key as keyof ReviewFilters];
  }).length;
}

function StatPill({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/85 p-4">
      <div className="mb-2 flex items-center justify-between gap-3 text-zinc-500">
        <p className="text-[10px] font-bold uppercase tracking-widest">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-black tracking-tight text-white tabular-nums">
        {value}
      </p>
    </div>
  );
}

export function MovieAnalyticsView({ movieId, onBack }: MovieAnalyticsViewProps) {
  const [data, setData] = useState<MovieAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewFilters, setReviewFilters] = useState<ReviewFilters>(DEFAULT_REVIEW_FILTERS);
  const [reviewFilterOpen, setReviewFilterOpen] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const response = await axios.get<MovieAnalytics>(
          `${API_URL}/api/v1/admin/movies/${movieId}/analytics`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setData(response.data);
      } catch (err: unknown) {
        const message =
          axios.isAxiosError(err) && typeof err.response?.data?.detail === "string"
            ? err.response.data.detail
            : "Movie analytics could not be loaded.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalytics();
  }, [movieId]);

  const filteredRatings = useMemo(() => {
    const query = reviewFilters.query.trim().toLowerCase();
    const minScore = reviewFilters.scoreMin === "" ? null : Number(reviewFilters.scoreMin);
    const maxScore = reviewFilters.scoreMax === "" ? null : Number(reviewFilters.scoreMax);

    const ratings = (data?.ratings ?? []).filter((rating) => {
      if (
        query &&
        !rating.username.toLowerCase().includes(query) &&
        !(rating.review_text || "").toLowerCase().includes(query)
      ) {
        return false;
      }
      if (minScore !== null && rating.overall_score < minScore) return false;
      if (maxScore !== null && rating.overall_score > maxScore) return false;
      if (!dateInRange(rating.created_at, reviewFilters.reviewedFrom, reviewFilters.reviewedTo)) return false;
      if (!dateInRange(rating.weekly_drop_start_date, reviewFilters.dropFrom, reviewFilters.dropTo)) return false;
      if (reviewFilters.spoiler === "spoiler-free" && rating.has_spoilers) return false;
      if (reviewFilters.spoiler === "spoilers" && !rating.has_spoilers) return false;
      if (reviewFilters.anonymous === "anonymous" && !rating.is_anonymous) return false;
      if (reviewFilters.anonymous === "named" && rating.is_anonymous) return false;
      if (reviewFilters.late === "late" && !rating.is_late) return false;
      if (reviewFilters.late === "on-time" && rating.is_late) return false;
      if (reviewFilters.text === "with-text" && !rating.review_text) return false;
      if (reviewFilters.text === "no-text" && rating.review_text) return false;
      return true;
    });

    return [...ratings].sort((a, b) => {
      switch (reviewFilters.sort) {
        case "scoreDesc":
          return b.overall_score - a.overall_score;
        case "scoreAsc":
          return a.overall_score - b.overall_score;
        case "username":
          return a.username.localeCompare(b.username);
        case "recent":
        default:
          return (new Date(b.created_at || 0).getTime() || b.id) - (new Date(a.created_at || 0).getTime() || a.id);
      }
    });
  }, [data?.ratings, reviewFilters]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500">
        Loading movie analytics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <ArrowLeft size={16} /> Back to Movies
        </button>
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-red-200">
          {error || "Movie analytics could not be loaded."}
        </div>
      </div>
    );
  }

  const backdrop = imageUrl(data.movie.backdrop_path, "original");
  const poster = imageUrl(data.movie.poster_path, "w342");
  const releaseYear = data.movie.release_date
    ? new Date(data.movie.release_date).getFullYear()
    : null;
  const genreNames = data.movie.genres.map((genre) => genre.name).filter(Boolean);
  const activeReviewFilterCount = countActiveReviewFilters(reviewFilters);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        <ArrowLeft size={16} /> Back to Movies
      </button>

      <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/45" />
        <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[180px_1fr] lg:p-8">
          <div className="hidden overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl sm:block">
            {poster ? (
              <img src={poster} alt={data.movie.title} className="aspect-[2/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center text-sm text-zinc-600">
                No Poster
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-red-400">
              Movie Analytics
            </p>
            <h2 className="max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl">
              {data.movie.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-300">
              {releaseYear ? <span>{releaseYear}</span> : null}
              {data.movie.director_name ? <span>{data.movie.director_name}</span> : null}
              {genreNames.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="rounded bg-zinc-800/80 px-2 py-1 text-xs font-bold uppercase tracking-wider text-zinc-200"
                >
                  {genre}
                </span>
              ))}
            </div>
            {data.movie.overview ? (
              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 line-clamp-3">
                {data.movie.overview}
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatPill
                title="Average"
                value={scoreValue(data.stats.average_score)}
                icon={<Star size={18} />}
              />
              <StatPill
                title="Ratings"
                value={data.stats.total_ratings}
                icon={<Users size={18} />}
              />
              <StatPill
                title="Median"
                value={scoreValue(data.stats.median_score)}
                icon={<TrendingUp size={18} />}
              />
              <StatPill
                title="Spread"
                value={data.stats.score_spread}
                icon={<Film size={18} />}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill title="Highest" value={scoreValue(data.stats.highest_score)} icon={<Star size={18} />} />
        <StatPill title="Lowest" value={scoreValue(data.stats.lowest_score)} icon={<Star size={18} />} />
        <StatPill title="Text Reviews" value={data.stats.text_review_count} icon={<MessageSquareText size={18} />} />
        <StatPill title="Spoiler Reviews" value={data.stats.spoiler_review_count} icon={<EyeOff size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold tracking-tight text-zinc-100">Score Distribution</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Approved visible ratings only.
            </p>
          </div>
          <div className="h-72 w-full">
            {data.stats.total_ratings > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.score_distribution} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="score"
                    stroke="#a1a1aa"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}-${Math.min(Number(value) + 9, 100)}`}
                  />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#f4f4f5" }}
                    cursor={{ fill: "#27272a" }}
                    formatter={(value) => [`${value ?? 0}`, "Ratings"]}
                    labelFormatter={(value) => `Score ${value}-${Math.min(Number(value) + 9, 100)}`}
                  />
                  <Bar dataKey="count" name="Ratings" fill="#0078b2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-800 text-sm text-zinc-500">
                No approved visible ratings yet.
              </div>
            )}
          </div>
        </div>

        <SubCategoryRadar data={data.subcategories} />
      </div>

      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-zinc-100">Reviews and Scores</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Real usernames are shown for admin audit, including anonymous public reviews.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative flex-1 lg:w-72 lg:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="search"
                  value={reviewFilters.query}
                  onChange={(e) => setReviewFilters((filters) => ({ ...filters, query: e.target.value }))}
                  placeholder="Search reviews or users..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-3 text-sm text-white outline-none transition-colors focus:border-red-500"
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setReviewFilterOpen((open) => !open)}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors sm:w-auto ${
                    reviewFilterOpen || activeReviewFilterCount > 0
                      ? "border-red-500/50 bg-red-600 text-white"
                      : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <Filter size={16} />
                  Filters
                  {activeReviewFilterCount > 0 ? (
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-black">
                      {activeReviewFilterCount}
                    </span>
                  ) : null}
                </button>

                {reviewFilterOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-[min(92vw,460px)] rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/40">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">Review Filters</p>
                        <p className="text-xs text-zinc-500">Filter scores, dates, moderation flags, and authors.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReviewFilterOpen(false)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"
                        aria-label="Close review filters"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Reviewed From
                        <input
                          type="date"
                          value={reviewFilters.reviewedFrom}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, reviewedFrom: e.target.value }))}
                          className="admin-filter-control admin-filter-date"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Reviewed To
                        <input
                          type="date"
                          value={reviewFilters.reviewedTo}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, reviewedTo: e.target.value }))}
                          className="admin-filter-control admin-filter-date"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Drop From
                        <input
                          type="date"
                          value={reviewFilters.dropFrom}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, dropFrom: e.target.value }))}
                          className="admin-filter-control admin-filter-date"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Drop To
                        <input
                          type="date"
                          value={reviewFilters.dropTo}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, dropTo: e.target.value }))}
                          className="admin-filter-control admin-filter-date"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Min Score
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={reviewFilters.scoreMin}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, scoreMin: e.target.value }))}
                          placeholder="0"
                          className="admin-filter-control"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Max Score
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={reviewFilters.scoreMax}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, scoreMax: e.target.value }))}
                          placeholder="100"
                          className="admin-filter-control"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Spoilers
                        <select
                          value={reviewFilters.spoiler}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, spoiler: e.target.value as ReviewFilters["spoiler"] }))}
                          className="admin-filter-control admin-filter-select"
                        >
                          <option value="all">All reviews</option>
                          <option value="spoiler-free">Spoiler-free only</option>
                          <option value="spoilers">Spoilers only</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Public Name
                        <select
                          value={reviewFilters.anonymous}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, anonymous: e.target.value as ReviewFilters["anonymous"] }))}
                          className="admin-filter-control admin-filter-select"
                        >
                          <option value="all">All reviewers</option>
                          <option value="anonymous">Anonymous public reviews</option>
                          <option value="named">Named public reviews</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Timing
                        <select
                          value={reviewFilters.late}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, late: e.target.value as ReviewFilters["late"] }))}
                          className="admin-filter-control admin-filter-select"
                        >
                          <option value="all">Any timing</option>
                          <option value="on-time">On-time</option>
                          <option value="late">Late</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Review Text
                        <select
                          value={reviewFilters.text}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, text: e.target.value as ReviewFilters["text"] }))}
                          className="admin-filter-control admin-filter-select"
                        >
                          <option value="all">Any text state</option>
                          <option value="with-text">Written reviews</option>
                          <option value="no-text">Scores only</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Sort
                        <select
                          value={reviewFilters.sort}
                          onChange={(e) => setReviewFilters((filters) => ({ ...filters, sort: e.target.value as ReviewFilters["sort"] }))}
                          className="admin-filter-control admin-filter-select"
                        >
                          <option value="recent">Newest first</option>
                          <option value="scoreDesc">Score high to low</option>
                          <option value="scoreAsc">Score low to high</option>
                          <option value="username">Username A-Z</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
                      <p className="text-xs text-zinc-500">{filteredRatings.length} reviews match</p>
                      <button
                        type="button"
                        onClick={() => setReviewFilters(DEFAULT_REVIEW_FILTERS)}
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
        </div>

        {filteredRatings.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {filteredRatings.map((rating) => (
              <article key={rating.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-bold text-white">{rating.username}</p>
                      <span className="text-xs text-zinc-600">#{rating.user_id}</span>
                      {rating.is_anonymous ? (
                        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          Anonymous
                        </span>
                      ) : null}
                      {rating.has_spoilers ? (
                        <span className="rounded border border-red-500/30 bg-red-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-300">
                          Spoiler
                        </span>
                      ) : null}
                      {rating.is_late ? (
                        <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                          Late
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={13} /> {formatDate(rating.created_at)}
                      </span>
                      {rating.weekly_drop_start_date ? (
                        <span>Drop week {formatDate(rating.weekly_drop_start_date)}</span>
                      ) : null}
                    </div>
                    <p className="mt-4 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                      {rating.review_text || "No written review."}
                    </p>
                  </div>
                  <div className="flex-shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Score</p>
                    <p className="text-3xl font-black text-white tabular-nums">{rating.overall_score}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-48 items-center justify-center p-8 text-center text-sm text-zinc-500">
            {data.ratings.length > 0
              ? "No reviews match the current filters."
              : "No approved visible ratings yet for this movie."}
          </div>
        )}
      </section>
    </div>
  );
}
