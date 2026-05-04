import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Film, Search, User, Share2, Trophy, ChevronDown, TrendingUp, Check } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ResultsHero } from '../components/ResultsHero';
import { SubCategoryBreakdown } from '../components/SubCategoryBreakdown';
import { CommunityTakes } from '../components/CommunityTakes';

interface ResultsData {
  drop_id: number;
  movie: {
    title: string;
    release_date: string | null;
    backdrop_path: string | null;
    director?: string;
  };
  official_score: number;
  user_score: number | null;
  total_votes: number;
  sub_categories: {
    story?: number | null;
    performances?: number | null;
    visuals?: number | null;
    sound?: number | null;
    rewatchability?: number | null;
    enjoyment?: number | null;
    emotional_impact?: number | null;
  };
  reviews: any[];
}

// Mock Rankings
const MOCK_RANKINGS = [
    {
        id: 'all-time',
        label: "All-Time Ranking",
        rank: 4,
        isNew: true,
        badge: "Highest of 2024",
        surrounding: [
            { rank: 3, title: "Oppenheimer", score: 92 },
            { rank: 4, title: "Current Movie", score: 88, isCurrent: true },
            { rank: 5, title: "The Batman", score: 85 }
        ]
    },
    {
        id: 'sci-fi',
        label: "Sci-Fi Epics",
        rank: 1,
        isNew: false,
        badge: "New #1",
        surrounding: [
            { rank: 1, title: "Current Movie", score: 88, isCurrent: true },
            { rank: 2, title: "Interstellar", score: 87 },
            { rank: 3, title: "Blade Runner 2049", score: 86 }
        ]
    }
];

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRanking, setExpandedRanking] = useState<string | null>('all-time');
  const [copied, setCopied] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/api/v1/results/${id}`, { headers });
        setData(response.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Results not found for this drop.");
        } else {
          setError("Failed to load results.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchResults();
    }
  }, [id, user, API_URL]);
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">{error}</h2>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-zinc-800 rounded"
        >
          Back Home
        </button>
      </div>
    );
  }

  const bgImage = data.movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${data.movie.backdrop_path}`
    : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-600 selection:text-white pb-20 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 text-red-600 cursor-pointer" onClick={() => navigate('/')}>
              <Film size={28} strokeWidth={2.5} />
              <span className="text-xl font-black tracking-tighter text-white uppercase hidden sm:block">Reel Review</span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-zinc-300">
            <button className="hover:text-white transition-colors"><Search size={20} strokeWidth={2.5} /></button>
            <button className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-zinc-500 transition-colors">
              <User size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main>
        <ResultsHero 
          movie={data.movie} 
          totalVotes={data.total_votes} 
          officialScore={data.official_score}
          userScore={data.user_score}
        />

        {/* CTA for users who haven't voted */}
        {data.user_score === null && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-gradient-to-br from-red-600/20 to-zinc-900/50 border border-red-600/30 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm">
              <div className="space-y-4 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Your voice is missing!</h2>
                <p className="text-zinc-400 max-w-xl text-lg">
                  You haven't rated <span className="text-white font-bold">{data.movie.title}</span> yet. Join the community and let your score be heard!
                </p>
              </div>
              <button 
                onClick={() => navigate(`/vote/${data.drop_id}`)}
                className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-red-900/40 text-lg hover:scale-105 active:scale-95 shrink-0"
              >
                Rate This Movie
              </button>
            </div>
          </div>
        )}

        {/* CONTENT LAYOUT */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COL: Analytics & Details (4 cols) */}
          <div className="lg:col-span-4 space-y-10">
            
            {/* Shareable Movie Stub */}
            <div className="relative bg-zinc-200 text-zinc-900 rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-300 group">
                {/* Top Art */}
                <div className="h-32 relative overflow-hidden bg-zinc-900">
                    <img src={bgImage} className="w-full h-full object-cover opacity-50 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500" alt="movie" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                        <h3 className="text-white font-black text-2xl tracking-tighter drop-shadow-md leading-none">{data.movie.title}</h3>
                        <span className="text-xs font-bold text-zinc-300 bg-zinc-950/50 backdrop-blur-sm px-2 py-1 rounded border border-zinc-700/50">
                            {data.movie.release_date ? new Date(data.movie.release_date).getFullYear() : 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Scores & Details */}
                <div className="px-5 py-5 bg-zinc-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your Vote</p>
                            {data.user_score != null ? (
                              <p className="text-5xl font-black tracking-tighter text-zinc-900 tabular-nums leading-none mt-1">{data.user_score}</p>
                            ) : (
                              <button onClick={() => navigate(`/vote/${data.drop_id}`)} className="bg-red-600 text-white font-bold text-xs px-2 py-1 rounded mt-1">Rate Now</button>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Comm Avg</p>
                            <p className="text-3xl font-bold text-zinc-700 tabular-nums leading-none mt-1">{Math.round(data.official_score)}</p>
                        </div>
                    </div>

                    <div className="w-full h-px bg-zinc-300"></div>

                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Director</p>
                            <p className="text-sm font-bold text-zinc-900">{data.movie.director || 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Standout Category</p>
                            <p className="text-sm font-bold text-zinc-900 flex items-center justify-end gap-1">
                                Category <span className="text-zinc-500 font-medium">(-)</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Perforated Edge */}
                <div className="relative flex items-center justify-center h-4 bg-zinc-100">
                    <div className="w-full border-t-[3px] border-dotted border-zinc-300"></div>
                    <div className="absolute -left-3 w-6 h-6 bg-zinc-950 rounded-full"></div>
                    <div className="absolute -right-3 w-6 h-6 bg-zinc-950 rounded-full"></div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-4 bg-zinc-100 flex justify-between items-center">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1 opacity-60">
                            <div className="w-1 h-5 bg-zinc-900 rounded-sm"></div>
                            <div className="w-2 h-5 bg-zinc-900 rounded-sm"></div>
                            <div className="w-0.5 h-5 bg-zinc-900 rounded-sm"></div>
                            <div className="w-1.5 h-5 bg-zinc-900 rounded-sm"></div>
                            <div className="w-1 h-5 bg-zinc-900 rounded-sm"></div>
                            <div className="w-3 h-5 bg-zinc-900 rounded-sm"></div>
                            <div className="w-0.5 h-5 bg-zinc-900 rounded-sm"></div>
                            <div className="w-2 h-5 bg-zinc-900 rounded-sm"></div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-[0.2em] leading-none">RR-DROP-{data.drop_id}</span>
                    </div>
                    <button 
                      onClick={handleShare}
                      className={`flex items-center gap-2 ${copied ? 'bg-green-600' : 'bg-red-600 hover:bg-red-500'} text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md shadow-red-900/20`}
                    >
                        {copied ? <Check size={16} /> : <Share2 size={16} />}
                        {copied ? 'Copied!' : 'Share Stub'}
                    </button>
                </div>
            </div>

            {/* HALL OF FAME (Expandable Ranking Updates) */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                    <Trophy className="text-amber-400" size={20} /> Hall of Fame Updates
                </h3>

                {MOCK_RANKINGS.map((ranking) => {
                    const isExpanded = expandedRanking === ranking.id;

                    return (
                        <div key={ranking.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
                            <button
                                onClick={() => setExpandedRanking(isExpanded ? null : ranking.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-white tracking-tight">{ranking.label}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-black text-amber-400 leading-none">#{ranking.rank}</span>
                                    <ChevronDown size={18} className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="p-5 border-t border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row gap-5 animate-in slide-in-from-top-2 duration-200">
                                    <img src={bgImage} className="w-20 h-28 object-cover rounded-lg shadow-md hidden sm:block" alt="poster" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <h4 className="font-bold text-white mb-0.5">{data.movie.title}</h4>
                                                {ranking.isNew && (
                                                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">New Entry</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {ranking.badge && (
                                                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mt-1 flex items-center justify-end gap-1">
                                                        <TrendingUp size={10} /> {ranking.badge}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            {ranking.surrounding.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex justify-between text-sm p-2.5 rounded-lg transition-colors ${item.isCurrent
                                                            ? 'bg-zinc-800/80 text-amber-400 font-bold border border-zinc-700 shadow-inner'
                                                            : 'text-zinc-400 font-medium hover:bg-zinc-800/50 cursor-pointer'
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        {item.isCurrent && <ChevronDown className="rotate-180 text-amber-500" size={14} />}
                                                        {item.rank}. {item.title === "Current Movie" ? data.movie.title : item.title}
                                                    </span>
                                                    <span>{item.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50">
              <SubCategoryBreakdown subCategories={data.sub_categories} />
            </div>

          </div>

          {/* RIGHT COL: Community Takes (8 cols) */}
          <div className="lg:col-span-8">
            <CommunityTakes reviews={data.reviews} officialScore={data.official_score} userScore={data.user_score} />
          </div>
        </div>
      </main>

      {/* Back to Top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:border-zinc-600 transition-all shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <ChevronDown className="rotate-180" size={24} />
        </button>
      )}
    </div>
  );
}
