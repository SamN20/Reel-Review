import { Sparkles, Shuffle, X } from "lucide-react";
import type { WeeklyDropOption } from "../types";

type MovieDraftCardProps = {
  option: WeeklyDropOption;
  rank?: number;
  disabled?: boolean;
  onClick: () => void;
};

const sourceMeta = {
  smart: {
    label: "Smart Pick",
    icon: Sparkles,
    className: "text-amber-400 bg-zinc-950/80 border-amber-800/60",
  },
  wildcard: {
    label: "Wildcard",
    icon: Shuffle,
    className: "text-blue-400 bg-zinc-950/80 border-blue-800/60",
  },
  fallback: {
    label: "Pool Pick",
    icon: Sparkles,
    className: "text-zinc-400 bg-zinc-950/80 border-zinc-700/60",
  },
};

const rankColors: Record<number, string> = {
  1: "text-amber-400",
  2: "text-zinc-300",
  3: "text-amber-600",
};

export function MovieDraftCard({
  option,
  rank,
  disabled = false,
  onClick,
}: MovieDraftCardProps) {
  const meta = sourceMeta[option.source];
  const SourceIcon = meta.icon;
  const isRanked = rank !== undefined;

  const backdropUrl = option.movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${option.movie.backdrop_path}`
    : option.movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${option.movie.poster_path}`
    : null;

  const rankColor = rank ? (rankColors[rank] ?? "text-zinc-400") : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex w-full flex-col overflow-hidden rounded-xl border bg-zinc-900 text-left
        transition-all duration-300 ease-out
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
        ${isRanked
          ? "border-zinc-700 shadow-lg hover:border-red-700/60 hover:shadow-red-950/30"
          : "border-zinc-800 hover:-translate-y-1 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/60"
        }
      `}
    >
      {/* Backdrop image area */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
        {backdropUrl ? (
          <>
            <img
              src={backdropUrl}
              alt={option.movie.title}
              className={`h-full w-full object-cover transition-transform duration-700
                ${!disabled && !isRanked ? "group-hover:scale-[1.04]" : ""}
                ${isRanked ? "scale-[1.03] brightness-75" : ""}
              `}
            />
            {/* Always-on gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-700 text-sm">
            No Image
          </div>
        )}

        {/* Source badge — top left */}
        <div className={`absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md border px-2 py-1 backdrop-blur-sm transition-opacity duration-300 ${meta.className} ${isRanked ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
          <SourceIcon size={11} strokeWidth={2.5} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{meta.label}</span>
        </div>

        {/* Rank badge — top right, always visible when ranked */}
        {isRanked && (
          <div className={`draft-card-rank-pop absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950/80 backdrop-blur-sm ring-1 ring-white/10 font-black text-xl tabular-nums ${rankColor}`}>
            {rank}
          </div>
        )}

        {/* Remove hint — appears on hover when ranked */}
        {isRanked && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-950/80 px-3 py-2 backdrop-blur-sm ring-1 ring-red-800/40">
              <X size={14} className="text-red-400" strokeWidth={2.5} />
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">Remove</span>
            </div>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="flex flex-1 flex-col p-3">
        <h4 className="line-clamp-1 text-sm font-bold tracking-tight text-white">
          {option.movie.title}
        </h4>
        {!isRanked && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {option.movie.overview || "No overview available."}
          </p>
        )}
      </div>
    </button>
  );
}

