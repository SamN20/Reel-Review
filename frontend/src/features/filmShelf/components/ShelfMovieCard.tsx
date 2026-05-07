import { Activity, CheckCircle2, ChevronRight, Play, Star, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { formatDateUTC } from "../../../lib/dateUtils";
import type { ArchiveMovieItem, ArchiveShelfKind } from "../api";
import { getBackdropUrl, getReleaseYear } from "../image";

interface ShelfMovieCardProps {
  item: ArchiveMovieItem;
  shelfKind: ArchiveShelfKind;
}

function scoreTone(userScore: number, communityScore: number | null) {
  if (communityScore === null) {
    return "text-zinc-200";
  }
  return userScore >= communityScore ? "text-green-400" : "text-amber-500";
}

export function ShelfMovieCard({ item, shelfKind }: ShelfMovieCardProps) {
  const navigate = useNavigate();
  const isMissedShelf = shelfKind === "missed";
  const userScore = item.user_score;
  const isRated = item.user_has_rated && userScore !== null;
  const imageUrl = getBackdropUrl(item.movie.backdrop_path);
  const resultsPath = `/results/${item.drop_id}`;
  const votePath = `/vote/${item.drop_id}`;
  const primaryPath = item.user_has_rated ? resultsPath : votePath;

  return (
    <article
      onClick={() => navigate(primaryPath)}
      className="group relative min-w-[82vw] sm:min-w-[390px] md:min-w-[430px] lg:min-w-[460px] xl:min-w-[500px] aspect-[16/10] sm:aspect-[16/9] snap-start overflow-hidden rounded-lg border border-zinc-800/70 bg-zinc-900 cursor-pointer transition-all duration-300 hover:border-zinc-500 focus-within:border-zinc-500"
    >
      <img
        src={imageUrl}
        alt={item.movie.title}
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
          isRated ? "opacity-45 group-hover:opacity-30" : "opacity-65 group-hover:scale-105 group-hover:opacity-45"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/45 via-transparent to-zinc-950/25" />

      {item.rank ? (
        <div className="absolute -bottom-5 -left-3 select-none text-8xl font-black leading-none text-white/10 sm:text-9xl">
          {item.rank}
        </div>
      ) : null}

      <div className="absolute left-3 top-3 z-10 rounded border border-zinc-800/80 bg-zinc-950/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300 backdrop-blur sm:left-4 sm:top-4">
        Ended {formatDateUTC(item.end_date)}
      </div>

      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/85 px-2.5 py-1.5 font-black text-white shadow-xl backdrop-blur transition-transform group-hover:scale-105 sm:right-4 sm:top-4">
        <Star size={14} className="text-amber-400" fill="currentColor" />
        <span className="tabular-nums">{item.community_score ?? "--"}</span>
      </div>

      <div className="absolute inset-0 z-20 hidden items-center justify-center gap-3 bg-zinc-950/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:flex">
        {!item.user_has_rated ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              navigate(resultsPath);
            }}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-zinc-950 shadow-xl transition-transform hover:scale-105 active:scale-95"
          >
            <ChevronRight size={18} />
            View Results
          </button>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            navigate(primaryPath);
          }}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95 ${
            !item.user_has_rated
              ? "bg-red-600 shadow-red-900/40 hover:bg-red-500"
              : "border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/15"
          }`}
        >
          {!item.user_has_rated ? <Play size={18} fill="currentColor" /> : <ChevronRight size={18} />}
          {item.user_has_rated ? "View Results" : "Rate Now"}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 z-10 w-full p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
            {getReleaseYear(item.movie.release_date)}
          </span>
          {item.movie.genres[0] ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {item.movie.genres[0].name}
            </span>
          ) : null}
          {item.divisiveness !== null && shelfKind === "divisive" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-400">
              <Trophy size={11} />
              Spread {item.divisiveness}
            </span>
          ) : null}
        </div>

        <h3 className="mb-3 line-clamp-1 text-xl font-black tracking-tight text-white transition-colors group-hover:text-red-400 sm:text-2xl">
          {item.movie.title}
        </h3>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-800/60 pt-3">
          {isRated ? (
            <>
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                <CheckCircle2 size={14} className="text-green-500" />
                Rated
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  You
                </span>
                <span
                  className={`rounded bg-zinc-800 px-2 py-1 text-xs font-black tabular-nums ${scoreTone(
                    userScore,
                    item.community_score,
                  )}`}
                >
                  {userScore}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className={`flex items-center gap-1.5 text-xs font-black ${isMissedShelf ? "text-red-500" : "text-zinc-400"}`}>
                <Activity size={14} />
                Open for votes
              </div>
              <div className="flex items-center gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(resultsPath);
                  }}
                  className="rounded border border-zinc-700 bg-zinc-950/70 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-300"
                >
                  Results
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(votePath);
                  }}
                  className="rounded bg-red-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white"
                >
                  Rate
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
