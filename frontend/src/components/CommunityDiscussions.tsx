import {
  MessageSquare,
  ShieldAlert,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

export function CommunityDiscussions() {
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  const handleComingSoon = (feature: string) => {
    setComingSoon(feature);
    setTimeout(() => setComingSoon(null), 2000);
  };

  return (
    <section className="pt-6 border-t border-zinc-900/50 grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-20">
      {/* Left Col: Discussions */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="text-zinc-400" size={20} />
          <h3 className="text-xl font-bold tracking-tight text-white">
            Community Discussions
          </h3>
        </div>

        <div className="space-y-3">
          <div
            onClick={() => handleComingSoon("general")}
            className={`p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 rounded-xl transition-all cursor-pointer group flex justify-between items-center ${comingSoon === "general" ? "opacity-50 scale-95" : ""}`}
          >
            <div>
              <h4 className="font-bold text-zinc-100 mb-1">
                {comingSoon === "general"
                  ? "Feature Coming Soon..."
                  : "General Thoughts (Spoiler-Free)"}
              </h4>
              <p className="text-sm text-zinc-500">Join the conversation</p>
            </div>
            <ChevronRight className="text-zinc-600 group-hover:text-white transition-colors" />
          </div>

          <div
            onClick={() => handleComingSoon("spoiler")}
            className={`p-4 bg-red-950/10 hover:bg-red-950/20 border border-red-900/30 hover:border-red-800/50 rounded-xl transition-all cursor-pointer group flex justify-between items-center ${comingSoon === "spoiler" ? "opacity-50 scale-95" : ""}`}
          >
            <div>
              <h4 className="font-bold text-red-50 flex items-center gap-2 mb-1">
                <ShieldAlert size={16} className="text-red-500" />
                {comingSoon === "spoiler"
                  ? "Feature Coming Soon..."
                  : "The Spoiler Zone"}
              </h4>
              <p className="text-sm text-zinc-500">Enter at your own risk.</p>
            </div>
            <ChevronRight className="text-red-900 group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Right Col: Watch Parties */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="text-zinc-400" size={20} />
          <h3 className="text-xl font-bold tracking-tight text-white">
            Upcoming Watch Parties
          </h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex items-center justify-center text-zinc-500 text-sm">
            No watch parties scheduled for this drop yet.
          </div>

          <button
            onClick={() => handleComingSoon("host")}
            className={`w-full p-4 border border-dashed border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm ${comingSoon === "host" ? "bg-zinc-800 scale-95" : ""}`}
          >
            {comingSoon === "host" ? "Coming Soon..." : "+ Host a Watch Party"}
          </button>
        </div>
      </div>
    </section>
  );
}
