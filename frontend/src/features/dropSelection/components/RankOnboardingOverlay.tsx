import { createPortal } from "react-dom";
import { ListOrdered, ChevronRight, X, Trophy, ArrowRight } from "lucide-react";

type RankOnboardingOverlayProps = {
  onDismiss: () => void;
};

const STEPS = [
  {
    icon: ListOrdered,
    iconClass: "text-white bg-zinc-800 ring-zinc-700",
    title: "Browse the shortlist",
    body: "After your rating is in, everyone gets the same slate of pool movies: a mix of smart picks and wildcards.",
  },
  {
    icon: ArrowRight,
    iconClass: "text-red-400 bg-red-950/40 ring-red-800/50",
    title: "Build your ranking",
    body: "Tap a movie to add it to your ballot. Your first pick sits at #1, and every pick after that follows in order.",
  },
  {
    icon: X,
    iconClass: "text-zinc-400 bg-zinc-900 ring-zinc-800",
    title: "Change your mind",
    body: "Tap a ranked movie again to remove it, or keep drafting until the list matches your actual preference.",
  },
  {
    icon: Trophy,
    iconClass: "text-amber-400 bg-amber-950/40 ring-amber-800/50",
    title: "The ranking decides",
    body: "On Monday, instant-runoff counting picks the winner. Your ballot stays editable until this week's drop closes.",
  },
];

export function RankOnboardingOverlay({ onDismiss }: RankOnboardingOverlayProps) {
  return createPortal(
    <div className="draft-modal-in fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950/95 px-5 backdrop-blur-xl">

      {/* Skip */}
      <button
        onClick={onDismiss}
        className="absolute right-5 top-5 text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        Skip intro
      </button>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="vote-success-content mb-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            Rank Next Week's Drop
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Put your favorites in order. The whole community is choosing from this same shortlist.
          </p>
        </div>

        {/* Steps */}
        <div className="draft-success-picks space-y-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                style={{ animationDelay: `${i * 70}ms` }}
                className="draft-card-enter flex items-start gap-4 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/20"
              >
                <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${step.iconClass}`}>
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{step.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={onDismiss}
          className="vote-success-text mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 text-sm font-black uppercase tracking-widest text-zinc-950 shadow-lg shadow-amber-900/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-300 active:scale-[0.97]"
        >
          Got it — let's rank
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
