import { CheckCircle2, CircleDot, Clock3, ExternalLink, Rocket } from "lucide-react";

import type { RoadmapItem, RoadmapStatus } from "../types";

const STATUS_DETAILS: Record<
  RoadmapStatus,
  { label: string; eyebrow: string; icon: typeof CircleDot; accent: string; line: string; text: string }
> = {
  now: {
    label: "Now",
    eyebrow: "In motion",
    icon: Rocket,
    accent: "border-red-500/60 bg-red-950/50 text-red-200",
    line: "bg-red-600",
    text: "text-red-300",
  },
  next: {
    label: "Next",
    eyebrow: "Queued up",
    icon: CircleDot,
    accent: "border-amber-500/60 bg-amber-950/40 text-amber-200",
    line: "bg-amber-500",
    text: "text-amber-200",
  },
  later: {
    label: "Later",
    eyebrow: "On the shelf",
    icon: Clock3,
    accent: "border-blue-500/60 bg-blue-950/40 text-blue-200",
    line: "bg-blue-500",
    text: "text-blue-200",
  },
  shipped: {
    label: "Shipped",
    eyebrow: "Shipped",
    icon: CheckCircle2,
    accent: "border-emerald-500/60 bg-emerald-950/40 text-emerald-200",
    line: "bg-emerald-500",
    text: "text-emerald-200",
  },
};

function shippedLabel(item: RoadmapItem) {
  if (item.status !== "shipped" || !item.shipped_at) {
    return STATUS_DETAILS[item.status].eyebrow;
  }
  const date = new Date(item.shipped_at);
  if (Number.isNaN(date.getTime())) {
    return STATUS_DETAILS[item.status].eyebrow;
  }
  return `Shipped ${date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
}

type RoadmapTimelineProps = {
  items: RoadmapItem[];
};

export function RoadmapTimeline({ items }: RoadmapTimelineProps) {
  return (
    <div className="relative max-w-4xl">
      <div className="absolute left-[17px] top-4 h-[calc(100%-2rem)] w-px bg-zinc-800/80 md:left-[25px]" />

      <div className="space-y-10">
        {items.map((item) => {
          const details = STATUS_DETAILS[item.status];
          const Icon = details.icon;
          const showCta = Boolean(item.cta_label && item.cta_url);

          return (
            <article key={item.id} className="group relative pl-14 md:pl-20">
              <div className={`absolute left-0 top-1.5 flex h-9 w-9 items-center justify-center rounded-full border bg-zinc-950 ${details.accent} md:left-2`}>
                <Icon size={17} />
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className={`h-px w-6 md:w-8 ${details.line}`} />
                <span className={`rounded border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${details.accent}`}>
                  {details.label}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  {shippedLabel(item)}
                </span>
              </div>

              <div className="border-b border-zinc-900 pb-10 transition-colors duration-300 group-hover:border-zinc-800">
                <h2 className="max-w-2xl text-2xl font-black tracking-tight text-white transition-colors duration-300 group-hover:text-zinc-200 sm:text-3xl">
                  {item.title}
                </h2>
                {item.description ? (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{item.description}</p>
                ) : null}
                {showCta ? (
                  <a
                    href={item.cta_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded border border-zinc-800/80 bg-zinc-900/40 px-4 py-2 text-sm font-bold text-zinc-300 backdrop-blur-md outline-none transition-colors hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-white"
                  >
                    {item.cta_label}
                    <ExternalLink size={15} />
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
