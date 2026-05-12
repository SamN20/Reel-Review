import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, useParams } from "react-router-dom";
import axios from "axios";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { Loader2, Settings, Star, Clock, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

interface ProfileMovie {
  id: number;
  title: string;
  poster_path: string | null;
}

interface ProfileRating {
  overall_score: number;
  movie: ProfileMovie;
  created_at: string;
  weekly_drop_id: number | null;
}

interface UserProfile {
  id: number;
  username: string;
  display_name: string | null;
  use_display_name: boolean;
  total_votes: number;
  average_score: number;
  recent_ratings: ProfileRating[];
  favorite_movies: ProfileRating[];
}

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"recent" | "favorites" | "settings">("recent");
  
  // If viewing another user's profile, we are in public mode
  const isPublicView = !!username;
  
  // Settings form state
  const [useDisplayName, setUseDisplayName] = useState(false);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);
  const [publicProfile, setPublicProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isPublicView && !user) return;
      
      try {
        const token = localStorage.getItem("token");
        
        let url = "";
        let headers = {};
        
        if (isPublicView) {
          url = `${API_URL}/api/v1/users/by-username/${username}/profile`;
          if (token) headers = { Authorization: `Bearer ${token}` };
        } else {
          url = `${API_URL}/api/v1/users/${user?.id}/profile`;
          headers = { Authorization: `Bearer ${token}` };
        }
        
        const response = await axios.get(url, { headers });
        setProfile(response.data);
        
        // Initialize settings state only if not public view
        if (!isPublicView && user) {
          setUseDisplayName(user.use_display_name);
          setShowOnLeaderboard(user.show_on_leaderboard);
          setPublicProfile(user.public_profile);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, username, isPublicView, authLoading, API_URL]);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/v1/users/me/preferences`,
        {
          use_display_name: useDisplayName,
          show_on_leaderboard: showOnLeaderboard,
          public_profile: publicProfile,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update global context
      updateUser({
        use_display_name: useDisplayName,
        show_on_leaderboard: showOnLeaderboard,
        public_profile: publicProfile,
      });
      
      // Notification would go here
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setSavingSettings(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  if (!isPublicView && !user) return <Navigate to="/?login=true" />;

  const preferredName = profile?.use_display_name && profile?.display_name ? profile.display_name : profile?.username;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
      <SiteHeader />
      
      <main className="flex-1 pt-24 pb-12 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-red-600 w-8 h-8" /></div>
        ) : profile ? (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-red-900 to-red-600 flex items-center justify-center text-5xl font-black text-white shadow-lg shrink-0">
                {preferredName?.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h1 className="text-4xl font-black tracking-tight">{preferredName}</h1>
                  <p className="text-zinc-400 text-sm tracking-widest uppercase mt-1">@{profile.username}</p>
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

            {/* Tabs */}
            <div className="border-b border-zinc-800">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("recent")}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "recent" ? "border-red-600 text-red-600" : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"}`}
                >
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Recent Activity</span>
                </button>
                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "favorites" ? "border-red-600 text-red-600" : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"}`}
                >
                  <span className="flex items-center gap-2"><Star className="w-4 h-4" /> Favorites</span>
                </button>
                {!isPublicView && (
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "settings" ? "border-red-600 text-red-600" : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"}`}
                  >
                    <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Privacy Settings</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="py-4">
              {activeTab === "recent" && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {profile.recent_ratings.length > 0 ? profile.recent_ratings.map((rating, i) => (
                    <MovieCard key={i} rating={rating} />
                  )) : (
                    <p className="text-zinc-500 col-span-full">No recent activity.</p>
                  )}
                </div>
              )}

              {activeTab === "favorites" && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {profile.favorite_movies.length > 0 ? profile.favorite_movies.map((rating, i) => (
                    <MovieCard key={i} rating={rating} />
                  )) : (
                    <p className="text-zinc-500 col-span-full">No favorite movies found yet. Start rating!</p>
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl">
                  <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">Use Display Name</h3>
                        <p className="text-sm text-zinc-400">Show your KeyN display name instead of username.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={useDisplayName} onChange={(e) => setUseDisplayName(e.target.checked)} />
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">Show on Leaderboards</h3>
                        <p className="text-sm text-zinc-400">Allow your account to appear in public rankings.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={showOnLeaderboard} onChange={(e) => setShowOnLeaderboard(e.target.checked)} />
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">Public Profile</h3>
                        <p className="text-sm text-zinc-400">Allow other users to view your profile and ratings.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={publicProfile} onChange={(e) => setPublicProfile(e.target.checked)} />
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-800">
                    <button
                      onClick={saveSettings}
                      disabled={savingSettings}
                      className="bg-white text-zinc-950 font-bold px-6 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      {savingSettings ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-12">Failed to load profile.</div>
        )}
      </main>
      
      <SiteFooter />
    </div>
  );
}

function MovieCard({ rating }: { rating: ProfileRating }) {
  const posterUrl = rating.movie.poster_path 
    ? `https://image.tmdb.org/t/p/w342${rating.movie.poster_path}` 
    : "https://via.placeholder.com/342x513.png?text=No+Poster";

  if (!rating.weekly_drop_id) {
    return (
      <div className="group relative rounded-xl overflow-hidden aspect-[2/3] bg-zinc-900 border border-zinc-800 block">
        <img 
          src={posterUrl} 
          alt={rating.movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <h3 className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors">{rating.movie.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-amber-400 font-black text-lg">{rating.overall_score}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/results/${rating.weekly_drop_id}`} className="group relative rounded-xl overflow-hidden aspect-[2/3] bg-zinc-900 border border-zinc-800 block">
      <img 
        src={posterUrl} 
        alt={rating.movie.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <h3 className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors">{rating.movie.title}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-amber-400 font-black text-lg">{rating.overall_score}</span>
        </div>
      </div>
    </Link>
  );
}
