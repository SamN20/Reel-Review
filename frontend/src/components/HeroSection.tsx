import { Play, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface Movie {
  title: string;
  overview: string | null;
  backdrop_path: string | null;
}

interface WeeklyDrop {
  id: number;
  movie: Movie;
  start_date: string;
  end_date: string;
}

export function HeroSection({ currentDrop }: { currentDrop: WeeklyDrop | null }) {
    const navigate = useNavigate();
    const [partyComingSoon, setPartyComingSoon] = useState(false);

    if (!currentDrop) {
        return <div className="w-full h-[85vh] min-h-[600px] bg-zinc-950 animate-pulse" />;
    }

    const bgImage = currentDrop.movie.backdrop_path 
        ? `https://image.tmdb.org/t/p/original${currentDrop.movie.backdrop_path}` 
        : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop";

    return (
        <section className="relative w-full h-[85vh] min-h-[600px] flex items-end justify-center pb-16 md:pb-24">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-60"
                    style={{ backgroundImage: `url(${bgImage})` }}
                ></div>
                {/* Multi-layered cinematic gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-transparent to-transparent"></div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:w-2/3 lg:w-1/2 mr-auto">
                <div className="flex items-center gap-4 mb-6">
                    <span className="px-3 py-1.5 text-xs font-black bg-red-600 text-white rounded uppercase tracking-widest shadow-lg shadow-red-900/20 flex items-center gap-2">
                        Featured Pick
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-zinc-300 drop-shadow-md bg-zinc-900/50 px-3 py-1 rounded backdrop-blur-sm border border-zinc-800">
                        <Clock size={16} className="text-red-500" /> 
                        Closes {new Date(currentDrop.end_date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter leading-[1.1] drop-shadow-2xl">
                    {currentDrop.movie.title}
                </h1>

                <p className="text-lg md:text-xl text-zinc-300 mb-6 max-w-xl leading-relaxed drop-shadow-md font-medium">
                    {currentDrop.movie.overview || "No overview available."}
                </p>

                {/* Voting Stats - Averages Hidden! */}
                <div className="flex items-center gap-6 mb-8 text-sm font-semibold text-zinc-400">
                    <div className="flex items-center gap-2">
                        <Users size={18} className="text-zinc-300" />
                        <span className="text-white">Active</span> Users Voting
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                        onClick={() => navigate('/vote')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black tracking-wide rounded-lg transition-colors shadow-xl"
                    >
                        <Play size={20} fill="currentColor" />
                        Rate This Week
                    </button>
                    <button
                        onClick={() => {
                            setPartyComingSoon(true);
                            setTimeout(() => setPartyComingSoon(false), 2000);
                        }}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 backdrop-blur-md font-bold tracking-wide rounded-lg border transition-all duration-300 ${
                            partyComingSoon 
                                ? 'bg-zinc-800 border-zinc-500 text-white scale-95' 
                                : 'bg-zinc-900/60 hover:bg-zinc-800/80 text-white border-zinc-700/50'
                        }`}
                    >
                        {partyComingSoon ? (
                            <span className="animate-pulse">Coming Soon...</span>
                        ) : (
                            <>
                                <Users size={20} />
                                Find a Watch Party
                            </>
                        )}
                    </button>
                </div>
            </div>
        </section>
    );
}
