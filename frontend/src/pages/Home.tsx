import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { HeroSection } from "../components/HeroSection";
import { FilmShelf } from "../components/FilmShelf";
import { CommunityDiscussions } from "../components/CommunityDiscussions";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

interface CurrentDrop {
  id: number;
  movie: {
    title: string;
    overview: string | null;
    backdrop_path: string | null;
  };
  start_date: string;
  end_date: string;
}

export default function Home() {
  const { user, loading: authLoading, login } = useAuth();

  const [currentDrop, setCurrentDrop] = useState<CurrentDrop | null>(null);
  const [pastDrops, setPastDrops] = useState([]);
  const [activeVoters, setActiveVoters] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchData = async () => {
      let activeDropId: number | null = null;
      try {
        const currentRes = await axios.get(`${API_URL}/api/v1/drops/current`);
        setCurrentDrop(currentRes.data);
        activeDropId = currentRes.data?.id || null;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setCurrentDrop(null);
        } else {
          console.error("Failed to fetch current drop", err);
        }
      }

      if (activeDropId !== null) {
        try {
          const resultsRes = await axios.get(`${API_URL}/api/v1/results/${activeDropId}`);
          setActiveVoters(resultsRes.data?.total_votes || 0);
        } catch (resErr) {
          console.error("Failed to fetch active voters for current drop", resErr);
        }
      }

      try {
        const headers = user
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {};
        const pastRes = await axios.get(`${API_URL}/api/v1/drops/past`, {
          headers,
        });
        setPastDrops(pastRes.data);
      } catch (err) {
        console.error("Failed to fetch past drops", err);
      }

      setLoading(false);
    };

    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, user, API_URL]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8">Reel Review</h1>
        <div className="text-center">
          <p className="mb-4 text-zinc-400">Join the weekly drop.</p>
          <button
            onClick={login}
            className="px-6 py-3 bg-red-600 font-bold rounded hover:bg-red-700 transition-colors"
          >
            Login with KeyN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-600 selection:text-white flex flex-col overflow-x-hidden">
      <SiteHeader activeSection="current-week" />

      <main className="flex-1 pb-16">
        <HeroSection
          currentDrop={currentDrop}
          canManageDrops={Boolean(user?.is_admin)}
          activeVoters={activeVoters}
        />

        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16 -mt-8 relative z-20">
          <FilmShelf pastDrops={pastDrops} />
          <CommunityDiscussions />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
