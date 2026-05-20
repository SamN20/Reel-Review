import { CheckCircle2, CircleDot, Clock3, Rocket } from "lucide-react";

import type { RoadmapItem, RoadmapStatus } from "../types";

const STATUS_DETAILS: Record<
  RoadmapStatus,
  { label: string; eyebrow: string; icon: typeof CircleDot; accent: string }
> = {
  now: {
    label: "Now",
    eyebrow: "In motion",
    icon: Rocket,
    accent: "text-red-400 border-red-500/40 bg-red-950/20",
  },
  next: {
    label: "Next",
    eyebrow: "Queued up",
    icon: CircleDot,
    accent: "text-amber-300 border-amber-500/40 bg-amber-950/20",
  },
  later: {
    label: "Later",
    eyebrow: "On the shelf",
    icon: Clock3,
    accent: "text-blue-300 border-blue-500/40 bg-blue-950/20",
  },
  shipped: {
    label: "Shipped",
    eyebrow: "Released",
    icon: CheckCircle2,
    accent: "text-emerald-300 border-emerald-500/40 bg-emerald-950/20",
  },
};

type RoadmapStatusColumnProps = {
  status: RoadmapStatus;
  items: RoadmapItem[];
};

export function RoadmapStatusColumn({ status, items }: RoadmapStatusColumnProps) {
  const details = STATUS_DETAILS[status];
  const Icon = details.icon;

  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-zinc-800/70 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {details.eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tighter text-white">{details.label}</h2>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${details.accent}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-lg border border-zinc-900 bg-zinc-900/25 p-5 text-sm font-medium text-zinc-500">
            Nothing public here yet.
          </div>
        ) : null}
        {items.map((item) => (
          <article
            key={item.id}
            className="group overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-5 shadow-xl transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/70"
          >
            <div className="mb-4 h-1.5 w-14 rounded-full bg-red-600 transition-all duration-300 group-hover:w-24" />
            <h3 className="text-xl font-black tracking-tight text-white">{item.title}</h3>
            {item.description ? (
              <p className="mt-3 text-sm leading-6 text-zinc-400">{item.description}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
