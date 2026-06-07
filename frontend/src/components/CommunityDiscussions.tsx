import {
  MessageSquare,
  ShieldAlert,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WatchPartyBoard } from "../features/watchParties/components/WatchPartyBoard";

export function CommunityDiscussions() {
  const navigate = useNavigate();

  return (
    <section className="pt-6 border-t border-zinc-900/50 grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-20">
      {/* Left Col: Discussion paths */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="text-zinc-400" size={20} />
          <h3 className="text-xl font-bold tracking-tight text-white">
            Community
          </h3>
        </div>

        <div className="space-y-3">
          <div
            onClick={() => navigate("/community?tab=spoiler-free")}
            className="p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 rounded-xl transition-all cursor-pointer group flex justify-between items-center"
          >
            <div>
              <h4 className="font-bold text-zinc-100 mb-1">
                General Thoughts (Spoiler-Free)
              </h4>
              <p className="text-sm text-zinc-500">Join the conversation</p>
            </div>
            <ChevronRight className="text-zinc-600 group-hover:text-white transition-colors" />
          </div>

          <div
            onClick={() => navigate("/community?tab=spoilers")}
            className="p-4 bg-red-950/10 hover:bg-red-950/20 border border-red-900/30 hover:border-red-800/50 rounded-xl transition-all cursor-pointer group flex justify-between items-center"
          >
            <div>
              <h4 className="font-bold text-red-50 flex items-center gap-2 mb-1">
                <ShieldAlert size={16} className="text-red-500" />
                The Spoiler Zone
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

        <WatchPartyBoard compact />
      </div>
    </section>
  );
}
