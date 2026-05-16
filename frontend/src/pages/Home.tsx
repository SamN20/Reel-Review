import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { HeroSection } from "../components/HeroSection";
import { FilmShelf } from "../components/FilmShelf";
import { CommunityDiscussions } from "../components/CommunityDiscussions";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { LoadingScreen } from "../components/LoadingScreen";
import { LoginScreen } from "../components/LoginScreen";
import { usePageMeta } from "../lib/seo";

interface CurrentDrop {
  id: number;
  movie: {
    title: string;
    overview: string | null;
    backdrop_path: string | null;
    release_date?: string | null;
  };
  start_date: string;
  end_date: string;
}

export default function Home() {
  const { user, loading: authLoading, login } = useAuth();

  // Initialize from cache if available to enable instant rendering without flash
  const cachedDataStr = localStorage.getItem("reelreview_home_cache");
  let cachedData: any = null;
  try {
    cachedData = cachedDataStr ? JSON.parse(cachedDataStr) : null;
  } catch (e) {
    console.error("Failed to parse cached home page data", e);
  }

  const [currentDrop, setCurrentDrop] = useState<CurrentDrop | null>(cachedData?.currentDrop || null);
  const [pastDrops, setPastDrops] = useState(cachedData?.pastDrops || []);
  const [activeVoters, setActiveVoters] = useState<number>(cachedData?.activeVoters || 0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showLoader, setShowLoader] = useState(!cachedData);

  const API_URL = import.meta.env.VITE_API_URL || "";
  const currentMovieTitle = currentDrop?.movie?.title;
  const currentMovieYear = currentDrop?.movie?.release_date
    ? ` (${new Date(currentDrop.movie.release_date).getFullYear()})`
    : "";

  usePageMeta({
    title: currentMovieTitle
      ? `Reel Review | This Week: ${currentMovieTitle}${currentMovieYear}`
      : "Reel Review | Weekly Community Movie Night",
    description: currentMovieTitle
      ? `This week's featured movie is ${currentMovieTitle}${currentMovieYear}. Rate it with the community, follow the live weekly drop, and catch up on past results in Reel Review.`
      : "A cinematic, community-driven weekly movie club where the byNolo community rates one featured film together.",
  });

  useEffect(() => {
    const startTime = Date.now();
    const MIN_LOAD_TIME = 800; // minimum loader duration in ms
    const hasCache = Boolean(cachedData);

    const fetchData = async () => {
      let activeDropId: number | null = null;
      let fetchedCurrentDrop = null;
      let fetchedActiveVoters = 0;
      let fetchedPastDrops = [];

      try {
        const currentRes = await axios.get(`${API_URL}/api/v1/drops/current`);
        fetchedCurrentDrop = currentRes.data;
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
          fetchedActiveVoters = resultsRes.data?.total_votes || 0;
          setActiveVoters(fetchedActiveVoters);
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
        fetchedPastDrops = pastRes.data;
        setPastDrops(pastRes.data);
      } catch (err) {
        console.error("Failed to fetch past drops", err);
      }

      // Update Cache
      localStorage.setItem(
        "reelreview_home_cache",
        JSON.stringify({
          currentDrop: fetchedCurrentDrop,
          pastDrops: fetchedPastDrops,
          activeVoters: fetchedActiveVoters,
          timestamp: Date.now(),
        })
      );

      if (!hasCache) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOAD_TIME - elapsedTime);

        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setShowLoader(false);
          }, 500); // matches the transition-opacity duration
        }, remainingTime);
      } else {
        setShowLoader(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, user, API_URL]);

  if (authLoading || showLoader) {
    return (
      <div
        className={`fixed inset-0 z-[9999] transition-opacity duration-500 ease-out-cubic ${
          isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)" }}
      >
        <LoadingScreen message="Synchronizing with the Film Shelf..." />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen pastDrops={pastDrops} onLogin={login} />;
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

        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16 mt-8 relative z-20">
          <FilmShelf pastDrops={pastDrops} />
          <CommunityDiscussions />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
