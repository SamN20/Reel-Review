import { Film } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SiteFooter() {
  const navigate = useNavigate();

  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4 md:px-8 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand Column */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-red-600 hover:text-red-500 transition-colors"
          >
            <Film size={24} strokeWidth={2.5} />
            <span className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-1.5">
              Reel Review
              <span className="text-[10px] font-bold tracking-normal normal-case text-zinc-600 font-sans">-</span>
              <span className="text-sm font-black bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent hover:from-green-500 hover:to-green-700 transition-all duration-300 normal-case font-sans">byNolo</span>
            </span>
          </button>
          <p className="text-zinc-500 text-xs text-center md:text-left max-w-xs leading-relaxed">
            Your cinematic dashboard for synchronized weekly movie drops, community ratings, and spoiler-filled reviews.
          </p>
        </div>

        {/* Navigation & Policies Column */}
        <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-xs font-semibold tracking-wide text-zinc-400">
          <button onClick={() => navigate("/")} className="hover:text-white transition-colors">
            Current Drop
          </button>
          <button onClick={() => navigate("/film-shelf")} className="hover:text-white transition-colors">
            The Film Shelf
          </button>
          <button onClick={() => navigate("/leaderboards")} className="hover:text-white transition-colors">
            Leaderboards
          </button>
          <button onClick={() => navigate("/discussions")} className="hover:text-white transition-colors">
            Discussions
          </button>
          <span className="hidden md:inline text-zinc-800">|</span>
          <button onClick={() => navigate("/terms")} className="hover:text-white transition-colors text-zinc-500">
            Terms of Use
          </button>
          <button onClick={() => navigate("/privacy")} className="hover:text-white transition-colors text-zinc-500">
            Privacy Policy
          </button>
          <button onClick={() => navigate("/attribution")} className="hover:text-white transition-colors text-zinc-500">
            Attributions
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
        <div className="flex items-center gap-1 flex-wrap justify-center sm:justify-start">
          <span>&copy; {new Date().getFullYear()} Reel Review. Created</span>
          <a className="font-extrabold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent hover:from-green-500 hover:to-green-700 transition-all duration-300 normal-case tracking-wide text-xs font-sans" href="https://bynolo.ca" target="_blank" rel="noopener noreferrer">byNolo</a>
        </div>
        <div className="text-center sm:text-right text-zinc-600">
          Powered by TMDB & JustWatch
        </div>
      </div>
    </footer>
  );
}
