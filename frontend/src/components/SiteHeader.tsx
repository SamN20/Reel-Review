import { useEffect, useState } from "react";
import { Bell, Film, Menu, Search, User, X } from "lucide-react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const handleNavClick = (feature: string) => {
    setNavComingSoon(feature);
    window.setTimeout(() => setNavComingSoon(null), 2000);
  };

  const closeMenuAndNavigate = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-5 bg-gradient-to-b from-zinc-950/90 to-transparent backdrop-blur-md transition-all">
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
          <div className="flex items-center gap-3 md:gap-5 text-zinc-300">
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
              className={`relative transition-colors ${navComingSoon === "bell" ? "text-red-500" : "hover:text-white hidden md:block"}`}
            >
              <Bell size={20} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center hover:border-zinc-500 transition-colors hidden md:flex"
            >
              <User size={16} />
            </button>
            
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="md:hidden p-2 text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-300 md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-24 px-6 gap-8">
          <div className="flex flex-col gap-6">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Navigation</span>
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                className={`text-2xl font-bold tracking-tight text-left ${
                  activeSection === link.id ? "text-red-600" : "text-white"
                }`}
                onClick={() => closeMenuAndNavigate(link.path)}
              >
                {link.label}
              </button>
            ))}
          </div>
          
          <div className="mt-auto mb-10 pt-8 border-t border-zinc-800 flex flex-col gap-6">
            <button
              type="button"
              onClick={() => {
                handleNavClick("bell");
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 text-zinc-300"
            >
              <Bell size={20} />
              <span className="font-medium text-lg">Notifications</span>
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 text-zinc-300"
            >
              <User size={20} />
              <span className="font-medium text-lg">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
