import { Flame } from "lucide-react";

export function EmptyState() {
  return (
    <div className="col-span-full text-center py-16 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 border-dashed backdrop-blur-sm">
      <Flame className="w-8 h-8 mx-auto mb-3 opacity-20" />
      <p>Not enough data yet to generate this leaderboard.</p>
    </div>
  );
}
