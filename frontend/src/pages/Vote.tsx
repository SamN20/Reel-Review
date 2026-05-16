import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Film,
  Eye,
  EyeOff,
  Star,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ScoreBar } from "../components/ScoreBar";
import { MovieMetaDetails } from "../components/MovieMetaDetails";
import { RankedMoviePicker } from "../features/dropSelection/components/RankedMoviePicker";
import { VoteSuccessOverlay } from "../features/dropSelection/components/VoteSuccessOverlay";
import { VoteOnboardingOverlay } from "../features/dropSelection/components/VoteOnboardingOverlay";
import { hasCompletedOnboarding, markOnboardingComplete, ONBOARDING_KEY_VOTE } from "../features/dropSelection/onboarding";
import type { NextVote } from "../features/dropSelection/types";
import type { MovieSummary } from "../features/results/api";
import { usePageMeta } from "../lib/seo";

interface Drop {
  id: number;
  movie: MovieSummary;
  start_date: string;
  end_date: string;
}

type RatingSubmitResponse = {
  next_vote?: NextVote | null;
};

export default function Vote() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [drop, setDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasWatched, setHasWatched] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [showSubCategories, setShowSubCategories] = useState(false);
  const [subScores, setSubScores] = useState<Record<string, number>>({
    story: 0,
    performances: 0,
    visuals: 0,
    sound: 0,
    rewatchability: 0,
    enjoyment: 0,
  });
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [nextVote, setNextVote] = useState<NextVote | null>(null);
  const [showVoteSuccess, setShowVoteSuccess] = useState(false);
  const [showVoteOnboarding, setShowVoteOnboarding] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "";
  const movieTitle = drop?.movie?.title;
  const movieYear = drop?.movie?.release_date
    ? ` (${new Date(drop.movie.release_date).getFullYear()})`
    : "";

  usePageMeta({
    title: movieTitle
      ? `Rate ${movieTitle}${movieYear} | Reel Review`
      : "Rate This Week's Movie | Reel Review",
    description: movieTitle
      ? `Submit your rating for ${movieTitle}${movieYear} on Reel Review and help shape this week's community movie result.`
      : "Submit your weekly movie rating on Reel Review.",
  });

  // Fetch the admin onboarding flag and decide whether to show the intro.
  useEffect(() => {
    if (authLoading || !user) return;
    const token = localStorage.getItem("token");
    axios
      .get<{ always_play: boolean }>(`${API_URL}/api/v1/admin/settings/onboarding`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.always_play || !hasCompletedOnboarding(ONBOARDING_KEY_VOTE)) {
          setShowVoteOnboarding(true);
        }
      })
      .catch(() => {
        // If the request fails (e.g. network), silently fall back to localStorage check.
        if (!hasCompletedOnboarding(ONBOARDING_KEY_VOTE)) {
          setShowVoteOnboarding(true);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchDrop = async () => {
      try {
        const endpoint = id ? `/api/v1/drops/${id}` : "/api/v1/drops/current";
        const response = await axios.get(`${API_URL}${endpoint}`);
        setDrop(response.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError(id ? "Weekly drop not found." : "No active weekly drop found right now. Check back Monday!");
        } else {
          setError("Failed to load drop.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDrop();
    }
  }, [API_URL, user, id]);

  useEffect(() => {
    const fetchMyRating = async () => {
      if (!drop || !user) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_URL}/api/v1/ratings/me/${drop.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const r = response.data;
        if (r) {
          // Check if drop is active (end_date >= today)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(drop.end_date);
          endDate.setHours(0, 0, 0, 0);

          if (endDate < today) {
            setIsLocked(true);
          }
          setHasWatched(r.watched_status);
          setOverallScore(r.overall_score);
          setIsAnonymous(r.is_anonymous);
          setIsSpoiler(r.has_spoilers || false);
          setReviewText(r.review_text || "");
          setSubScores({
            story: r.story_score || 0,
            performances: r.performances_score || 0,
            visuals: r.visuals_score || 0,
            sound: r.sound_score || 0,
            rewatchability: r.rewatchability_score || 0,
            enjoyment: r.enjoyment_score || 0,
          });
        }
      } catch (err) {
        if (!axios.isAxiosError(err) || err.response?.status !== 404) {
          console.error("Failed to fetch existing rating", err);
        }
      }
    };
    fetchMyRating();
  }, [drop, user, API_URL]);

  const handleSubmit = async () => {
    if (!drop || overallScore === 0) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        weekly_drop_id: drop.id,
        overall_score: overallScore,
        watched_status: hasWatched,
        story_score: subScores.story || null,
        performances_score: subScores.performances || null,
        visuals_score: subScores.visuals || null,
        sound_score: subScores.sound || null,
        rewatchability_score: subScores.rewatchability || null,
        enjoyment_score: subScores.enjoyment || null,
        review_text: reviewText || null,
        is_anonymous: isAnonymous,
        has_spoilers: isSpoiler,
      };

      const response = await axios.post<RatingSubmitResponse>(`${API_URL}/api/v1/ratings/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.next_vote) {
        setNextVote(response.data.next_vote);
      } else {
        setShowVoteSuccess(true);
      }
    } catch (err) {
      console.error(err);
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      alert(detail || "Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !drop) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">{error}</h2>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-zinc-800 rounded"
        >
          Back Home
        </button>
      </div>
    );
  }

  const bgImage = drop?.movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${drop.movie.backdrop_path}`
    : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-600 selection:text-white flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
      {/* LEFT COLUMN: Movie Details (Context) */}
      <div className="w-full lg:w-1/2 relative flex flex-col justify-between min-h-[60vh] lg:min-h-0 lg:h-screen pb-12 lg:pb-0">
        {/* Background Artwork */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent lg:bg-gradient-to-r lg:from-zinc-950/40 lg:via-zinc-950/80 lg:to-zinc-950"></div>
        </div>

        {/* Top Nav (Left Side) */}
        <div className="relative z-10 p-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-semibold text-sm"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2 text-red-600 lg:hidden">
            <Film size={20} strokeWidth={2.5} />
            <span className="font-black tracking-tighter text-white uppercase">
              Reel Review
            </span>
          </div>
        </div>

        {/* Movie Info */}
        <div className="relative z-10 p-6 md:p-12 max-w-2xl mt-auto">
          <div className="flex items-center gap-3 mb-4">
            {drop.movie.release_date && (
              <span className="px-2.5 py-1 text-xs font-bold bg-zinc-800 text-zinc-300 rounded border border-zinc-700">
                {new Date(drop.movie.release_date).getFullYear()}
              </span>
            )}
            <span className="text-sm font-semibold text-zinc-400">
              Featured Drop
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter leading-none text-white">
            {drop.movie.title}
          </h1>

          <p className="text-zinc-400 leading-relaxed mb-8 text-sm md:text-base hidden sm:block">
            {drop.movie.overview || "No overview available."}
          </p>

          <MovieMetaDetails
            directorName={drop.movie.director_name}
            watchProviders={drop.movie.watch_providers}
          />
        </div>
      </div>

      {/* RIGHT COLUMN: The Rating Panel (Action) */}
      <div className="w-full lg:w-1/2 flex-1 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-900 lg:h-screen lg:overflow-y-auto custom-scrollbar">
        <div className="max-w-xl mx-auto p-6 md:p-12 space-y-10">
          {/* Header */}
          <div className="hidden lg:flex items-center gap-2 text-red-600 mb-8">
            <Film size={24} strokeWidth={2.5} />
            <span className="font-black tracking-tighter text-white uppercase text-lg">
              Reel Review
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">
              Share your rating.
            </h2>
            <p className="text-zinc-400 text-sm">
              You can adjust or update your rating as long as this drop remains the active movie.
            </p>
          </div>

          {/* 1. Watched Status */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Have you seen it?</h3>
              <p className="text-zinc-500 text-sm">
                Add this to your watched history.
              </p>
            </div>
            <button
              onClick={() => !isLocked && setHasWatched(!hasWatched)}
              disabled={isLocked}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${hasWatched ? "bg-red-600" : "bg-zinc-700"} ${isLocked ? "cursor-not-allowed opacity-80" : ""}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${hasWatched ? "translate-x-7" : "translate-x-1"}`}
              />
            </button>
          </div>

          {/* 2. Overall Score (Required) */}
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Star className="text-red-600" fill="currentColor" size={20} />
                Overall Score
              </h3>
              <span className="text-5xl font-black tabular-nums tracking-tighter text-white">
                {overallScore || "--"}
                <span className="text-2xl text-zinc-600">/100</span>
              </span>
            </div>
            <ScoreBar
              score={overallScore}
              setScore={setOverallScore}
              size="large"
              disabled={isLocked}
            />
            <div className="flex justify-between text-xs font-bold text-zinc-600 uppercase tracking-widest px-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          <hr className="border-zinc-800/50" />

          {/* 3. Optional Sub-Categories */}
          <div className="w-full">
            <button
              onClick={() => setShowSubCategories(!showSubCategories)}
              className="w-full flex items-center justify-between text-left group"
            >
              <div>
                <h3 className="font-bold text-lg group-hover:text-red-400 transition-colors">
                  Sub-Categories
                </h3>
                <p className="text-zinc-500 text-sm">
                  Optional • Rate specific elements
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-red-400 group-hover:bg-red-950/30 transition-all">
                {showSubCategories ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${showSubCategories ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"}`}
            >
              <div className="overflow-hidden space-y-6">
                {[
                  { id: "story", label: "Story & Pacing" },
                  { id: "performances", label: "Performances" },
                  { id: "visuals", label: "Visuals & Cinematography" },
                  { id: "sound", label: "Sound & Score" },
                  { id: "rewatchability", label: "Rewatchability" },
                  { id: "enjoyment", label: "Pure Enjoyment" },
                ].map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-zinc-300">
                        {cat.label}
                      </span>
                      <span className="font-bold text-zinc-500 tabular-nums w-8 text-right">
                        {subScores[cat.id] || "-"}
                      </span>
                    </div>
                    <ScoreBar
                      score={subScores[cat.id]}
                      setScore={(val) =>
                        !isLocked && setSubScores({ ...subScores, [cat.id]: val })
                      }
                      size="small"
                      disabled={isLocked}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-zinc-800/50" />

          {/* 4. Text Review */}
          <div className="space-y-4 pb-8">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare size={18} className="text-zinc-400" />
                Your Take
              </h3>
              <span className="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded uppercase tracking-wider">
                Optional
              </span>
            </div>

            <div className="relative">
              <textarea
                value={reviewText}
                onChange={(e) => !isLocked && setReviewText(e.target.value)}
                disabled={isLocked}
                className={`w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 resize-none transition-all ${isLocked ? "cursor-not-allowed opacity-80" : ""}`}
                placeholder="What did you think of the movie? If your review contains plot twists, ending details, or major spoilers, be sure to check the spoiler toggle below."
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                <ShieldCheck size={14} /> Auto-moderated
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAnonymous ? "bg-red-600 border-red-600" : "bg-zinc-900 border-zinc-700 group-hover:border-zinc-500"}`}
              >
                {isAnonymous && (
                  <CheckCircle2
                    size={14}
                    className="text-white"
                    strokeWidth={3}
                  />
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={isAnonymous}
                onChange={() => setIsAnonymous(!isAnonymous)}
              />
              <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors flex items-center gap-2">
                {isAnonymous ? (
                  <EyeOff size={16} className="text-red-500" />
                ) : (
                  <Eye size={16} />
                )}
                Post anonymously
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group w-fit mt-2">
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSpoiler ? "bg-red-600 border-red-600" : "bg-zinc-900 border-zinc-700 group-hover:border-zinc-500"}`}
              >
                {isSpoiler && (
                  <CheckCircle2
                    size={14}
                    className="text-white"
                    strokeWidth={3}
                  />
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={isSpoiler}
                onChange={() => setIsSpoiler(!isSpoiler)}
              />
              <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors flex items-center gap-2">
                <AlertTriangle size={16} className={isSpoiler ? "text-red-500" : ""} />
                Mark as Spoiler
              </span>
            </label>
          </div>

          {/* Submit Action */}
          {nextVote && (
            <RankedMoviePicker
              nextVote={nextVote}
              onSaved={() => navigate("/")}
            />
          )}

          {showVoteSuccess && drop && (
            <VoteSuccessOverlay
              score={overallScore}
              movieTitle={drop.movie.title}
              backdropUrl={
                drop.movie.backdrop_path
                  ? `https://image.tmdb.org/t/p/original${drop.movie.backdrop_path}`
                  : null
              }
              onDone={() => navigate("/")}
            />
          )}

          {showVoteOnboarding && (
            <VoteOnboardingOverlay
              onDismiss={() => {
                markOnboardingComplete(ONBOARDING_KEY_VOTE);
                setShowVoteOnboarding(false);
              }}
            />
          )}

          <div className="sticky bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-8 pb-6 mt-auto">
            {isLocked ? (
              <div className="w-full py-5 rounded-xl font-black text-lg uppercase tracking-widest bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center justify-center gap-2 shadow-2xl">
                <CheckCircle2 size={24} className="text-green-500" />
                Rating Locked
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={overallScore === 0 || submitting}
                className={`w-full py-5 rounded-xl font-black text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-2xl
                                  ${overallScore > 0 && !submitting
                    ? "bg-red-600 text-white hover:bg-red-500 hover:-translate-y-1 shadow-red-900/30"
                    : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800"
                  }`}
              >
                {submitting
                  ? "Submitting..."
                  : overallScore > 0
                    ? "Submit Weekly Vote"
                    : "Select a Score to Vote"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
