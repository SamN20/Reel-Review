import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Loader2, CheckCircle2, ArrowRight, X, ListOrdered } from "lucide-react";
import { submitNextMovieBallot } from "../api";
import type { NextVote, WeeklyDropOption } from "../types";
import { MovieDraftCard } from "./MovieDraftCard";
import { DraftSuccessOverlay } from "./DraftSuccessOverlay";

type RankedMoviePickerProps = {
  nextVote: NextVote;
  onSaved: () => void;
};

export function RankedMoviePicker({ nextVote, onSaved }: RankedMoviePickerProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const initialRankedIds = nextVote.ballot?.ranked_movie_ids || [];
  const [rankedIds, setRankedIds] = useState<number[]>(initialRankedIds);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showDraftSuccess, setShowDraftSuccess] = useState(false);

  const optionMap = useMemo(() => {
    const map = new Map<number, WeeklyDropOption>();
    nextVote.options.forEach(opt => map.set(opt.movie.id, opt));
    return map;
  }, [nextVote.options]);

  const handleToggleRank = (movieId: number) => {
    if (nextVote.locked || saving) return;
    setRankedIds(current => {
      if (current.includes(movieId)) {
        return current.filter(id => id !== movieId);
      }
      return [...current, movieId];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await submitNextMovieBallot(nextVote.target_drop_id, rankedIds);
      setMessage("Your vote has been saved.");
      setShowDraftSuccess(true);
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : null;
      setMessage(detail || "Failed to save your vote.");
      setSaving(false);
    }
  };

  const rankedOptions = rankedIds
    .map(id => optionMap.get(id))
    .filter((opt): opt is WeeklyDropOption => Boolean(opt));
  const unrankedOptions = nextVote.options
    .filter(opt => !rankedIds.includes(opt.movie.id))
    .sort((a, b) => a.display_order - b.display_order);

  const totalOptions = nextVote.options.length;
  const canSave = rankedIds.length > 0;
  const isSaved = message.includes("saved");

  if (showDraftSuccess) {
    return (
      <DraftSuccessOverlay
        rankedOptions={rankedOptions}
        onDone={onSaved}
      />
    );
  }

  const modalContent = (
    <div className="draft-modal-in fixed inset-0 z-[9999] flex flex-col bg-zinc-950">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-zinc-900 px-4 py-4 md:px-8 md:py-5 bg-zinc-950">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-0.5">
            Community Draft
          </p>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
            Rank Next Week's Drop
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500 hidden sm:block">
            Select movies in order of preference — #1 is your top pick.
          </p>
        </div>
        <button
          onClick={onSaved}
          className="ml-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white active:scale-95"
          title="Skip"
          aria-label="Skip next vote"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Two-Column Body ─────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">

        {/* ── Pool Column — first on mobile, right on desktop ── */}
        <div className="order-1 lg:order-2 flex flex-col lg:w-1/2 min-h-0 border-b lg:border-b-0 lg:border-l border-zinc-900">
          {/* Column header */}
          <div className="flex-shrink-0 flex items-center gap-2.5 border-b border-zinc-900 px-4 py-3 md:px-6">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
              Available Pool
            </span>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-zinc-900 px-1.5 text-[10px] font-bold text-zinc-500 tabular-nums">
              {unrankedOptions.length}
            </span>
          </div>

          {/* Scrollable card grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            {unrankedOptions.length === 0 ? (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-800/60 text-center">
                <CheckCircle2 size={32} className="text-zinc-700" />
                <div>
                  <p className="text-sm font-bold text-zinc-500">All movies ranked</p>
                  <p className="text-xs text-zinc-700 mt-0.5">Hit confirm to submit your draft.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-max">
                {unrankedOptions.map((option) => (
                  <div key={`pool-${option.id}`} className="draft-card-enter">
                    <MovieDraftCard
                      option={option}
                      disabled={nextVote.locked || saving}
                      onClick={() => handleToggleRank(option.movie.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Ranked Column — second on mobile, left on desktop ── */}
        <div className="order-2 lg:order-1 flex flex-col lg:w-1/2 min-h-0">
          {/* Column header */}
          <div className="flex-shrink-0 flex items-center gap-2.5 border-b border-zinc-900 px-4 py-3 md:px-6">
            <span className="text-xs font-black uppercase tracking-widest text-white">
              Your Ranking
            </span>
            <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums transition-colors duration-300 ${rankedOptions.length > 0 ? "bg-red-950/60 text-red-400" : "bg-zinc-900 text-zinc-600"}`}>
              {rankedOptions.length}
            </span>
            {totalOptions > 0 && (
              <span className="text-[10px] text-zinc-700 tabular-nums">
                / {totalOptions}
              </span>
            )}
          </div>

          {/* Scrollable card grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            {rankedOptions.length === 0 ? (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-800/60 text-center">
                <ListOrdered size={32} className="text-zinc-700" />
                <div>
                  <p className="text-sm font-bold text-zinc-500">No picks yet</p>
                  <p className="text-xs text-zinc-700 mt-0.5">Tap movies from the pool to rank them.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-max">
                {rankedOptions.map((option, index) => (
                  <div key={`ranked-${option.id}`} className="draft-card-enter">
                    <MovieDraftCard
                      option={option}
                      rank={index + 1}
                      disabled={nextVote.locked || saving}
                      onClick={() => handleToggleRank(option.movie.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-zinc-900 bg-zinc-950 px-4 py-4 md:px-8">
        <div className="flex items-center justify-between gap-4">

          {/* Status text */}
          <div className="min-w-0 flex-1">
            {message ? (
              <p className={`text-sm font-semibold transition-all duration-300 ${message.includes("Failed") ? "text-red-400" : "text-emerald-400"}`}>
                {isSaved && <CheckCircle2 size={14} className="inline mr-1.5 mb-0.5" />}
                {message}
              </p>
            ) : (
              <p className="text-xs text-zinc-600">
                {nextVote.locked
                  ? "Voting is locked for this round."
                  : rankedOptions.length === 0
                  ? "Select at least one movie to submit."
                  : `${rankedOptions.length} of ${totalOptions} ranked.`}
              </p>
            )}
          </div>

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={nextVote.locked || saving || !canSave}
            className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-black uppercase tracking-widest
              transition-all duration-300
              ${canSave && !saving && !nextVote.locked
                ? "bg-red-600 text-white shadow-lg shadow-red-950/40 hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-red-900/50 active:scale-[0.97]"
                : "cursor-not-allowed border border-zinc-800 bg-zinc-900 text-zinc-600"
              }
            `}
          >
            {saving
              ? <Loader2 size={16} className="animate-spin" />
              : nextVote.locked
              ? <CheckCircle2 size={16} />
              : <ArrowRight size={16} />
            }
            {nextVote.locked ? "Locked" : saving ? "Saving…" : "Confirm Draft"}
          </button>

        </div>
      </div>

    </div>
  );

  return createPortal(modalContent, document.body);
}

