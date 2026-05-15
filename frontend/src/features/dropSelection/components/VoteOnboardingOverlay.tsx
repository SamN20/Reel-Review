import { createPortal } from "react-dom";
import { Star, ChevronRight, ToggleRight, MessageSquare, Trophy } from "lucide-react";

type VoteOnboardingOverlayProps = {
  onDismiss: () => void;
};

const STEPS = [
  {
    icon: Star,
    iconClass: "text-red-500 bg-red-950/40 ring-red-800/50",
    title: "Score out of 100",
    body: "Use the 10-block bar to give the weekly movie a clean score. You can update it while the drop is active.",
  },
  {
    icon: ToggleRight,
    iconClass: "text-zinc-300 bg-zinc-900 ring-zinc-800",
    title: "Mark as watched",
    body: "Use the watched toggle to keep your film history accurate before you submit your take.",
  },
  {
    icon: MessageSquare,
    iconClass: "text-blue-400 bg-blue-950/40 ring-blue-800/50",
    title: "Leave your take (optional)",
    body: "Add a short review, post anonymously if you want, and mark spoilers so other viewers stay protected.",
  },
  {
    icon: Trophy,
    iconClass: "text-amber-400 bg-amber-950/40 ring-amber-800/50",
    title: "Shape the next drop",
    body: "When next week is a User Vote, your submitted rating unlocks a ranked ballot for the community shortlist.",
  },
];

export function VoteOnboardingOverlay({ onDismiss }: VoteOnboardingOverlayProps) {
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            Weekly Drop Voting
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Rate the current film, keep spoilers contained, and help keep the weekly ritual moving.
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
          className="vote-success-text mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-red-950/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-500 active:scale-[0.97]"
        >
          Got it — let's vote
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
