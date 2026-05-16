import { Play, Users, Clock, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { formatDateUTC } from "../lib/dateUtils";

interface Movie {
  title: string;
  overview: string | null;
  backdrop_path: string | null;
}

interface WeeklyDrop {
  id: number;
  movie: Movie;
  start_date: string;
  end_date: string;
}

// ── Animated voter counter ────────────────────────────────────────────────────
export function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = count;
    const end = value;
    if (start === end) return;

    const range = end - start;
    const startTime = performance.now();
    let animationFrameId: number;

    const updateCount = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress);
      setCount(Math.round(start + range * easeProgress));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className="text-white font-extrabold tabular-nums tracking-wide">{count}</span>;
}

// ── Scroll hint ───────────────────────────────────────────────────────────────
function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY < 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      className={`hero-scroll-hint absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 transition-opacity duration-500 sm:bottom-8 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Explore</span>
      <ChevronDown size={20} className="text-zinc-500 hero-scroll-chevron" />
    </div>
  );
}

// ── Empty state (no drop scheduled) ──────────────────────────────────────────
function EmptyHero({ canManageDrops }: { canManageDrops: boolean }) {
  const navigate = useNavigate();

  return (
    <section className="hero-shell relative w-full flex items-end justify-center px-0 pb-14 pt-24 sm:pb-16 sm:pt-28 md:pb-24 md:pt-36">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.18),_transparent_35%),linear-gradient(180deg,_#18181b_0%,_#09090b_100%)]" />
      <div className="absolute inset-0 z-0 opacity-30 bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,255,255,0.03)_50%,transparent_52%,transparent_100%)] bg-[length:24px_24px]" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="max-w-3xl rounded-[1.75rem] border border-zinc-800 bg-zinc-950/75 p-6 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8 md:p-10">
          <span className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-zinc-200 bg-zinc-800 sm:text-xs">
            Weekly Drop Pending
          </span>
          <h1 className="mt-5 text-[clamp(2.4rem,9vw,4.75rem)] font-black leading-[1.02] tracking-tighter text-white sm:mt-6">
            No movie has been scheduled for the current week yet.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            The site is live and your account is working, but the homepage needs an active weekly drop before it can feature a film here.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {canManageDrops ? (
              <button
                onClick={() => navigate("/admin")}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black tracking-wide rounded-lg transition-colors shadow-xl"
              >
                Set Up This Week's Drop
              </button>
            ) : (
              <button
                onClick={() => navigate("/vote")}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black tracking-wide rounded-lg transition-colors shadow-xl"
              >
                Check Voting Page
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main HeroSection ──────────────────────────────────────────────────────────
export function HeroSection({
  currentDrop,
  canManageDrops = false,
  activeVoters = 0,
}: {
  currentDrop: WeeklyDrop | null;
  canManageDrops?: boolean;
  activeVoters?: number;
}) {
  const navigate = useNavigate();
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [entered, setEntered] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Trigger staggered entrance after image load (or after short fallback)
  useEffect(() => {
    if (!currentDrop) return;
    const timer = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(timer);
  }, [currentDrop]);

  if (!currentDrop) {
    return <EmptyHero canManageDrops={canManageDrops} />;
  }

  const bgImage = currentDrop.movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${currentDrop.movie.backdrop_path}`
    : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop";

  const overview = currentDrop.movie.overview || "";
  // Clamp overview to ~220 chars; expand via CSS max-height for a smooth transition
  const OVERVIEW_LIMIT = 220;
  const isLong = overview.length > OVERVIEW_LIMIT;

  const closingDate = formatDateUTC(currentDrop.end_date, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="hero-shell relative w-full overflow-hidden pb-16 pt-24 sm:pb-20 sm:pt-28 md:pb-28 md:pt-36">

      {/* ── Backdrop image (Ken Burns slow-zoom) ──────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Preload image to trigger imageLoaded */}
        <img
          ref={imgRef}
          src={bgImage}
          alt=""
          className="sr-only"
          onLoad={() => setImageLoaded(true)}
        />
        <div
          className={`absolute inset-0 bg-cover bg-center transition-[opacity,transform] duration-[1800ms] ease-out ${imageLoaded ? "opacity-70 scale-105" : "opacity-0 scale-100"}`}
          style={{
            backgroundImage: `url(${bgImage})`,
            transformOrigin: "60% 50%",
          }}
        />

        {/* Cinematic gradient stack */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/55 to-zinc-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-transparent" />
        {/* Strong top darkening so content doesn't fight the header */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-zinc-950 to-transparent" />

        {/* Ambient brand glow — bottom-right */}
        <div className="absolute bottom-0 right-0 w-[55%] h-[45%] bg-red-600/8 blur-[100px] rounded-full pointer-events-none" />
      </div>

      {/* ── Hero Content ──────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-7xl items-end px-4 sm:px-6 md:px-8">
        <div className="max-w-[min(42rem,100%)]">

          {/* Eyebrow metadata — editorial, not badge-y */}
          <div
            className={`mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400 transition-all duration-700 ease-out sm:mb-5 sm:text-sm ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "0ms" }}
          >
            <span className="text-red-500 font-bold uppercase tracking-widest text-[11px]">This Week</span>
            <span className="text-zinc-700">·</span>
            <Clock size={13} className="text-zinc-600" />
            <span>Closes {closingDate}</span>
          </div>

          {/* Title */}
          <h1
            className={`mb-4 text-[clamp(2.75rem,11vw,5.5rem)] font-black leading-[0.98] tracking-tighter text-white transition-all duration-700 ease-out sm:mb-5 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: "80ms", textShadow: "0 4px 40px rgba(0,0,0,0.6)" }}
          >
            {currentDrop.movie.title}
          </h1>

          {/* Overview — smooth max-height transition, no text swap jank */}
          {overview && (
            <div
              className={`mb-6 transition-all duration-700 ease-out sm:mb-7 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
              style={{ transitionDelay: "160ms" }}
            >
              <div
                className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
                style={{ maxHeight: overviewExpanded ? "32rem" : "7.5rem" }}
              >
                <p className="max-w-xl text-sm font-medium leading-relaxed text-zinc-300 sm:text-base md:text-lg">
                  {overview}
                </p>
              </div>
              {isLong && (
                <button
                  onClick={() => setOverviewExpanded((v) => !v)}
                  className="mt-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {overviewExpanded ? "Show less ↑" : "Read more ↓"}
                </button>
              )}
            </div>
          )}

          {/* Stats row — just voter count */}
          <div
            className={`mb-7 flex items-center gap-5 transition-all duration-700 ease-out sm:mb-8 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: "240ms" }}
          >
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <Users size={14} className="text-zinc-600" />
              <span>
                <AnimatedCounter value={activeVoters} /> <span>rated so far</span>
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all duration-700 ease-out ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: "320ms" }}
          >
            {/* Primary CTA */}
            <button
              onClick={() => navigate("/vote")}
              className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-red-600 px-6 py-4 text-sm font-black tracking-wide text-white transition-all duration-300 shadow-lg shadow-red-950/50 hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-red-900/60 active:scale-[0.97] sm:w-auto sm:px-8 sm:text-base"
            >
              {/* Shine sweep on hover */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
              <Play size={18} fill="currentColor" className="flex-shrink-0" />
              Rate This Week
            </button>

            {/* Secondary CTA */}
            <button
              onClick={() => navigate("/film-shelf")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-900/60 px-6 py-4 text-sm font-bold tracking-wide text-zinc-300 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-white active:scale-[0.97] sm:w-auto sm:text-base"
            >
              Browse Archive
            </button>
          </div>
        </div>
      </div>

      {/* ── Scroll hint chevron ────────────────────────────────────────── */}
      <ScrollHint />
    </section>
  );
}
