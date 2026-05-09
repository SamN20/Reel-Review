import { useEffect, useState } from "react";
import axios from "axios";
import { Bell, Film, LayoutDashboard, LogOut, Menu, Search, UserCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { SearchOverlay } from "./SearchOverlay";

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

const API_URL = import.meta.env.VITE_API_URL || "";

export function SiteHeader({ activeSection = null }: SiteHeaderProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [navComingSoon, setNavComingSoon] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const closeMenuAndNavigate = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  const openNotificationPreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get<{ url: string }>(
        `${API_URL}/api/v1/auth/notification-preferences-url`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Failed to open notification preferences", error);
      setNavComingSoon("bell");
      window.setTimeout(() => setNavComingSoon(null), 2000);
    }
  };

  const handleLogout = () => {
    setIsAccountOpen(false);
    setIsMenuOpen(false);
    logout();
    navigate("/");
  };

  const accountInitial = user?.username?.charAt(0).toUpperCase() || "?";

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
              onClick={() => setIsSearchOpen(true)}
              className="transition-colors hover:text-white"
              title="Search"
            >
              <Search size={20} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => void openNotificationPreferences()}
              className={`relative hidden transition-colors md:block ${navComingSoon === "bell" ? "text-red-500" : "hover:text-white"}`}
              title="Notification settings"
            >
              <Bell size={20} strokeWidth={2.5} />
            </button>
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setIsAccountOpen((open) => !open)}
                title="Account menu"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-black text-white transition-colors hover:border-red-500 hover:bg-zinc-800"
              >
                {accountInitial}
              </button>

              {isAccountOpen ? (
                <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
                  <div className="border-b border-zinc-800 px-4 py-3">
                    <p className="text-sm font-bold text-white">{user?.username || "Account"}</p>
                    <p className="text-xs text-zinc-500">{user?.email || "Reel Review"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      navigate("/profile");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
                  >
                    <UserCircle size={16} /> Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      navigate("/requests");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
                  >
                    <Film size={16} /> Movie Requests
                  </button>
                  {user?.is_admin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountOpen(false);
                        navigate("/admin");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
                    >
                      <LayoutDashboard size={16} /> Admin Dashboard
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 border-t border-zinc-800 px-4 py-3 text-left text-sm text-red-300 transition-colors hover:bg-red-950/30 hover:text-red-200"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              ) : null}
            </div>
            
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
                setIsMenuOpen(false);
                setIsSearchOpen(true);
              }}
              className="flex items-center gap-3 text-zinc-300"
            >
              <Search size={20} />
              <span className="font-medium text-lg">Search</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                void openNotificationPreferences();
              }}
              className="flex items-center gap-3 text-zinc-300"
            >
              <Bell size={20} />
              <span className="font-medium text-lg">Notification Settings</span>
            </button>
            <button
              type="button"
              onClick={() => closeMenuAndNavigate("/profile")}
              className="flex items-center gap-3 text-zinc-300"
            >
              <UserCircle size={20} />
              <span className="font-medium text-lg">Profile</span>
            </button>
            <button
              type="button"
              onClick={() => closeMenuAndNavigate("/requests")}
              className="flex items-center gap-3 text-zinc-300"
            >
              <Film size={20} />
              <span className="font-medium text-lg">Movie Requests</span>
            </button>
            {user?.is_admin ? (
              <button
                type="button"
                onClick={() => closeMenuAndNavigate("/admin")}
                className="flex items-center gap-3 text-zinc-300"
              >
                <LayoutDashboard size={20} />
                <span className="font-medium text-lg">Admin Dashboard</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 text-zinc-300"
            >
              <LogOut size={20} />
              <span className="font-medium text-lg">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      {isSearchOpen ? <SearchOverlay onClose={() => setIsSearchOpen(false)} /> : null}
    </>
  );
}
