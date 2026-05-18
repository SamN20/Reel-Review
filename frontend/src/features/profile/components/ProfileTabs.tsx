import { Clock, Settings, Star, Users } from "lucide-react";

import type { ProfileTab } from "../types";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  isPublicView: boolean;
  onChange: (tab: ProfileTab) => void;
}

export function ProfileTabs({ activeTab, isPublicView, onChange }: ProfileTabsProps) {
  return (
    <div className="border-b border-zinc-800">
      <nav className="flex space-x-8">
        <button
          onClick={() => onChange("recent")}
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "recent" ? "border-red-600 text-red-600" : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"}`}
        >
          <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Recent Activity</span>
        </button>
        <button
          onClick={() => onChange("favorites")}
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "favorites" ? "border-red-600 text-red-600" : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"}`}
        >
          <span className="flex items-center gap-2"><Star className="w-4 h-4" /> Favorites</span>
        </button>
        {!isPublicView && (
          <button
            onClick={() => onChange("invites")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "invites" ? "border-red-600 text-red-600" : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"}`}
          >
            <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Invites</span>
          </button>
        )}
        {!isPublicView && (
          <button
            onClick={() => onChange("settings")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "settings" ? "border-red-600 text-red-600" : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"}`}
          >
            <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Privacy Settings</span>
          </button>
        )}
      </nav>
    </div>
  );
}
