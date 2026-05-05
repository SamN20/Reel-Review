import { MonitorPlay, Users } from "lucide-react";

import type { WatchProvider } from "../features/results/api";

interface MovieMetaDetailsProps {
  directorName?: string | null;
  watchProviders: WatchProvider[];
  totalVotes?: number;
}

export function MovieMetaDetails({
  directorName,
  watchProviders,
  totalVotes,
}: MovieMetaDetailsProps) {
  const streamingProviders = watchProviders.filter((provider) =>
    ["flatrate", "free", "ads"].includes(provider.category),
  );
  const transactionalProviders = watchProviders.filter((provider) =>
    ["rent", "buy"].includes(provider.category),
  );
  const hasProviders =
    streamingProviders.length > 0 || transactionalProviders.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-zinc-400">
        {directorName ? <span>Dir. {directorName}</span> : null}
        {directorName && typeof totalVotes === "number" ? (
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
        ) : null}
        {typeof totalVotes === "number" ? (
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Users size={16} /> {totalVotes.toLocaleString()} Votes Cast
          </span>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Where to Watch
        </p>
        {hasProviders ? (
          <div className="space-y-3">
            {streamingProviders.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Streaming Services
                </p>
                <div className="flex flex-wrap gap-2">
                  {streamingProviders.map((provider) => (
                    <a
                      key={`${provider.region}-${provider.provider_id}`}
                      href={provider.link_url || "#"}
                      target={provider.link_url ? "_blank" : undefined}
                      rel={provider.link_url ? "noreferrer" : undefined}
                      className={`px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs font-bold text-zinc-200 flex items-center gap-2 transition-colors ${provider.link_url ? "hover:bg-zinc-800 hover:border-zinc-700" : "opacity-60 cursor-default pointer-events-none"}`}
                    >
                      <MonitorPlay size={14} className="text-blue-500" />
                      {provider.provider_name}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {transactionalProviders.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                  Rent or Buy
                </p>
                <div className="flex flex-wrap gap-2">
                  {transactionalProviders.map((provider) => (
                    <a
                      key={`${provider.region}-${provider.provider_id}`}
                      href={provider.link_url || "#"}
                      target={provider.link_url ? "_blank" : undefined}
                      rel={provider.link_url ? "noreferrer" : undefined}
                      className={`px-3 py-1.5 bg-zinc-950/70 border border-zinc-800 rounded-md text-xs font-bold text-zinc-400 flex items-center gap-2 transition-colors ${provider.link_url ? "hover:bg-zinc-900 hover:border-zinc-700 hover:text-zinc-300" : "opacity-60 cursor-default pointer-events-none"}`}
                    >
                      <MonitorPlay size={14} className="text-zinc-500" />
                      {provider.provider_name}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No streaming providers listed yet.</p>
        )}
      </div>
    </div>
  );
}
