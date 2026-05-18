import { ExternalLink, Star, Trophy } from "lucide-react";

import type { UserProfile } from "../types";

interface ProfileHeaderProps {
  profile: UserProfile;
  preferredName?: string;
  isPublicView: boolean;
  keynProfileUrl: string;
}

export function ProfileHeader({
  profile,
  preferredName,
  isPublicView,
  keynProfileUrl,
}: ProfileHeaderProps) {
  return (
    <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
      <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-red-900 to-red-600 flex items-center justify-center text-5xl font-black text-white shadow-lg shrink-0">
        {preferredName?.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 text-center md:text-left space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight">{preferredName}</h1>
            <p className="text-zinc-400 text-sm tracking-widest uppercase mt-1">@{profile.username}</p>
          </div>

          {!isPublicView && keynProfileUrl && (
            <a
              href={keynProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-sm font-semibold text-zinc-200 hover:text-white hover:border-zinc-700 transition-colors md:shrink-0"
            >
              <ExternalLink className="w-4 h-4 text-red-400" />
              Edit KeyN Profile
            </a>
          )}
        </div>

        <div className="flex flex-wrap justify-center md:justify-start gap-6">
          <div className="bg-zinc-950/50 rounded-lg px-4 py-3 border border-zinc-800/50 flex items-center gap-3">
            <Trophy className="text-amber-400 w-5 h-5" />
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Votes</p>
              <p className="text-xl font-bold">{profile.total_votes}</p>
            </div>
          </div>
          <div className="bg-zinc-950/50 rounded-lg px-4 py-3 border border-zinc-800/50 flex items-center gap-3">
            <Star className="text-amber-400 w-5 h-5" />
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Avg Score</p>
              <p className="text-xl font-bold">{profile.average_score}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
