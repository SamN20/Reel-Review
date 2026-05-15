import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Trophy } from "lucide-react";
import type { WeeklyDropOption } from "../types";

type DraftSuccessOverlayProps = {
  rankedOptions: WeeklyDropOption[];
  onDone: () => void;
};

/**
 * Full-screen celebration shown after the user confirms their next-week
 * draft rankings. Auto-dismisses after ~2.6 s.
 */
export function DraftSuccessOverlay({ rankedOptions, onDone }: DraftSuccessOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  // Show up to 3 ranked picks with their backdrop
  const top3 = rankedOptions.slice(0, 3);

  return createPortal(
    <div className="draft-success-overlay fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6">
      {/* Subtle colour wash from top pick's backdrop */}
      {top3[0]?.movie.backdrop_path && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/w1280${top3[0].movie.backdrop_path})`,
            filter: "blur(60px)",
            transform: "scale(1.15)",
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950" />

      {/* Content */}
      <div className="draft-success-content relative z-10 flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        {/* Icon */}
        <div className="draft-success-icon flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 ring-2 ring-amber-400/30 shadow-[0_0_40px_rgba(251,191,36,0.2)]">
          <Trophy size={30} className="text-amber-400" strokeWidth={2} />
        </div>

        {/* Headline */}
        <div className="draft-success-text">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
            Draft Confirmed
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Your picks are in.
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Your ranking will influence next week's drop.
          </p>
        </div>

        {/* Top picks strip */}
        {top3.length > 0 && (
          <div className="draft-success-picks flex items-end justify-center gap-3 sm:gap-4">
            {top3.map((option, i) => {
              const imgUrl = option.movie.backdrop_path
                ? `https://image.tmdb.org/t/p/w500${option.movie.backdrop_path}`
                : option.movie.poster_path
                ? `https://image.tmdb.org/t/p/w342${option.movie.poster_path}`
                : null;

              // Middle card (rank 2) is slightly smaller; rank 1 is tallest
              const heightClass = i === 0 ? "h-32 sm:h-40" : i === 1 ? "h-24 sm:h-32" : "h-20 sm:h-28";
              const rankColors = ["text-amber-400", "text-zinc-300", "text-amber-600"];

              return (
                <div
                  key={option.id}
                  style={{ animationDelay: `${i * 100}ms` }}
                  className={`draft-pick-card relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${heightClass} w-28 sm:w-36 flex-shrink-0`}
                >
                  {imgUrl && (
                    <img src={imgUrl} alt={option.movie.title} className="h-full w-full object-cover brightness-75" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />
                  {/* Rank number */}
                  <div className={`absolute left-2 top-2 text-2xl font-black tabular-nums drop-shadow-md ${rankColors[i]}`}>
                    {i + 1}
                  </div>
                  {/* Title */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="line-clamp-1 text-[10px] font-bold text-white">{option.movie.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-zinc-900">
        <div className="draft-success-progress h-full bg-amber-400" />
      </div>
    </div>,
    document.body,
  );
}
