import { useState, useEffect } from "react";
import axios from "axios";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { Loader2, Trophy, Users, Clapperboard, Flame, ListTree } from "lucide-react";
import { UserCard, type LBUser } from "../features/leaderboards/components/UserCard";
import { CrewCard, type LBCrew } from "../features/leaderboards/components/CrewCard";
import { DivisiveCard, type LBDivisive } from "../features/leaderboards/components/DivisiveCard";
import { CategoryMovieCard, type LBCategoryMovie } from "../features/leaderboards/components/CategoryMovieCard";
import { EmptyState } from "../features/leaderboards/components/EmptyState";

interface CategoryLeaderboardsData {
  story: LBCategoryMovie[];
  performances: LBCategoryMovie[];
  visuals: LBCategoryMovie[];
  sound: LBCategoryMovie[];
  rewatchability: LBCategoryMovie[];
  enjoyment: LBCategoryMovie[];
  emotional_impact: LBCategoryMovie[];
}

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "directors" | "actors" | "divisive" | "categories">("users");
  
  const [users, setUsers] = useState<LBUser[]>([]);
  const [directors, setDirectors] = useState<LBCrew[]>([]);
  const [actors, setActors] = useState<LBCrew[]>([]);
  const [divisive, setDivisive] = useState<LBDivisive[]>([]);
  const [categories, setCategories] = useState<CategoryLeaderboardsData | null>(null);
  
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "users" && users.length === 0) {
          const res = await axios.get(`${API_URL}/api/v1/leaderboards/users`);
          setUsers(res.data);
        } else if (activeTab === "directors" && directors.length === 0) {
          const res = await axios.get(`${API_URL}/api/v1/leaderboards/directors`);
          setDirectors(res.data);
        } else if (activeTab === "actors" && actors.length === 0) {
          const res = await axios.get(`${API_URL}/api/v1/leaderboards/actors`);
          setActors(res.data);
        } else if (activeTab === "divisive" && divisive.length === 0) {
          const res = await axios.get(`${API_URL}/api/v1/leaderboards/divisive`);
          setDivisive(res.data);
        } else if (activeTab === "categories" && !categories) {
          const res = await axios.get(`${API_URL}/api/v1/leaderboards/categories`);
          setCategories(res.data);
        }
      } catch (error) {
        console.error(`Failed to fetch ${activeTab} leaderboard`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, API_URL]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
      <SiteHeader activeSection="leaderboards" />
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-zinc-950 to-zinc-950 z-0" />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <p className="text-amber-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">Hall of Fame</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">The Leaderboards</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Discover the most active critics, top-rated talent, and the movies that tore the community apart.
          </p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <TabButton 
            active={activeTab === "users"} 
            onClick={() => setActiveTab("users")} 
            icon={<Trophy className="w-4 h-4" />} 
            label="Top Critics" 
          />
          <TabButton 
            active={activeTab === "directors"} 
            onClick={() => setActiveTab("directors")} 
            icon={<Clapperboard className="w-4 h-4" />} 
            label="Top Directors" 
          />
          <TabButton 
            active={activeTab === "actors"} 
            onClick={() => setActiveTab("actors")} 
            icon={<Users className="w-4 h-4" />} 
            label="Top Actors" 
          />
          <TabButton 
            active={activeTab === "divisive"} 
            onClick={() => setActiveTab("divisive")} 
            icon={<Flame className="w-4 h-4" />} 
            label="Most Divisive" 
          />
          <TabButton 
            active={activeTab === "categories"} 
            onClick={() => setActiveTab("categories")} 
            icon={<ListTree className="w-4 h-4" />} 
            label="Categories" 
          />
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === "users" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.map((u, i) => (
                    <UserCard key={u.id} user={u} rank={i + 1} />
                  ))}
                  {users.length === 0 && <EmptyState />}
                </div>
              )}
              
              {activeTab === "directors" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {directors.map((d, i) => (
                    <CrewCard key={d.name} crew={d} rank={i + 1} isDirector />
                  ))}
                  {directors.length === 0 && <EmptyState />}
                </div>
              )}

              {activeTab === "actors" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {actors.map((a, i) => (
                    <CrewCard key={a.name} crew={a} rank={i + 1} />
                  ))}
                  {actors.length === 0 && <EmptyState />}
                </div>
              )}

              {activeTab === "divisive" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {divisive.map((m, i) => (
                    <DivisiveCard key={m.id} movie={m} rank={i + 1} />
                  ))}
                  {divisive.length === 0 && <EmptyState />}
                </div>
              )}

              {activeTab === "categories" && categories && (
                <div className="space-y-16">
                  <CategorySection title="Story" data={categories.story} />
                  <CategorySection title="Performances" data={categories.performances} />
                  <CategorySection title="Visuals" data={categories.visuals} />
                  <CategorySection title="Sound & Music" data={categories.sound} />
                  <CategorySection title="Rewatchability" data={categories.rewatchability} />
                  <CategorySection title="Enjoyment" data={categories.enjoyment} />
                  <CategorySection title="Emotional Impact" data={categories.emotional_impact} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
        active 
          ? "bg-amber-500 text-zinc-950 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)]" 
          : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800/50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function CategorySection({ title, data }: { title: string; data: LBCategoryMovie[] }) {
  if (!data || data.length === 0) return null;
  
  return (
    <div>
      <h2 className="text-2xl font-black mb-6 flex items-center gap-3 uppercase tracking-widest text-zinc-300">
        <span className="w-8 h-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full inline-block shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
        {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {data.map((m, i) => (
          <CategoryMovieCard key={m.id} movie={m} rank={i + 1} categoryName={title} />
        ))}
      </div>
    </div>
  );
}
