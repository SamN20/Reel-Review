import { useState } from "react";
import { Bell, Film, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

type SiteHeaderSection = "current-week" | "film-shelf" | "leaderboards" | "discussions" | null;

interface SiteHeaderProps {
  activeSection?: SiteHeaderSection;
}

const NAV_LINKS = [
  { id: "current-week", label: "Current Week", path: "/" },
  { id: "film-shelf", label: "The Film Shelf", path: "/film-shelf" },
  { id: "leaderboards", label: "Leaderboards", path: "/leaderboards" },
  { id: "discussions", label: "Discussions", path: "/discussions" },
] as const;

export function SiteHeader({ activeSection = null }: SiteHeaderProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [navComingSoon, setNavComingSoon] = useState<string | null>(null);

  const handleNavClick = (feature: string) => {
    setNavComingSoon(feature);
    window.setTimeout(() => setNavComingSoon(null), 2000);
  };

  return (
    <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-5 bg-gradient-to-b from-zinc-950/90 to-transparent backdrop-blur-sm transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-10">
          <button
            type="button"
            className="flex items-center gap-2 text-red-600"
            onClick={() => navigate("/")}
          >
            <Film size={28} strokeWidth={2.5} />
            <span className="text-xl font-black tracking-tighter text-white uppercase">
              Reel Review
            </span>
          </button>
          <div className="hidden md:flex gap-8 text-sm font-semibold tracking-wide text-zinc-400">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                className={activeSection === link.id ? "text-white drop-shadow-md" : "hover:text-white transition-colors"}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-5 text-zinc-300">
          <button
            type="button"
            onClick={() => handleNavClick("search")}
            className={`transition-colors ${navComingSoon === "search" ? "text-red-500" : "hover:text-white"}`}
          >
            <Search size={20} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("bell")}
            className={`relative transition-colors ${navComingSoon === "bell" ? "text-red-500" : "hover:text-white"}`}
          >
            <Bell size={20} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-zinc-500 transition-colors"
          >
            <User size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
