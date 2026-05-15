import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Star } from "lucide-react";

type VoteSuccessOverlayProps = {
  score: number;
  movieTitle: string;
  backdropUrl: string | null;
  onDone: () => void;
};

/**
 * Full-screen celebration shown immediately after a user submits their
 * weekly vote (no next_vote flow). Auto-dismisses after ~2.4 s.
 */
export function VoteSuccessOverlay({
  score,
  movieTitle,
  backdropUrl,
  onDone,
}: VoteSuccessOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return createPortal(
    <div className="vote-success-overlay fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-zinc-950">
      {/* Blurred backdrop art */}
      {backdropUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${backdropUrl})`, filter: "blur(40px)", transform: "scale(1.1)" }}
        />
      )}
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950" />

      {/* Content */}
      <div className="vote-success-content relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        {/* Score ring */}
        <div className="vote-success-score relative flex h-36 w-36 items-center justify-center rounded-full border-2 border-red-600/40 bg-zinc-950/80 shadow-[0_0_60px_rgba(220,38,38,0.3)]">
          {/* Spinning ring accent */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-600 vote-spin" />
          <div className="flex flex-col items-center leading-none">
            <span className="text-5xl font-black tabular-nums text-white">{score}</span>
            <span className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">/100</span>
          </div>
        </div>

        {/* Text */}
        <div className="vote-success-text">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-500">
            Vote Locked In
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {movieTitle}
          </h2>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-400">
            <Star size={14} className="text-amber-400" fill="currentColor" />
            Your rating has been submitted
            <Star size={14} className="text-amber-400" fill="currentColor" />
          </p>
        </div>
      </div>

      {/* Progress bar that fills as the timeout elapses */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-zinc-900">
        <div className="vote-success-progress h-full bg-red-600" />
      </div>
    </div>,
    document.body,
  );
}
