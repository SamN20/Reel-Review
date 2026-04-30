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

export function HeroSection({
    currentDrop,
    canManageDrops = false,
}: {
    currentDrop: WeeklyDrop | null;
    canManageDrops?: boolean;
}) {
    const navigate = useNavigate();
    const [partyComingSoon, setPartyComingSoon] = useState(false);

    if (!currentDrop) {
        return (
            <section className="relative w-full min-h-[max(600px,85vh)] flex items-end justify-center pb-16 md:pb-24 pt-28 md:pt-36">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.18),_transparent_35%),linear-gradient(180deg,_#18181b_0%,_#09090b_100%)]"></div>
                <div className="absolute inset-0 z-0 opacity-30 bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,255,255,0.03)_50%,transparent_52%,transparent_100%)] bg-[length:24px_24px]"></div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8">
                    <div className="max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-950/75 backdrop-blur-xl p-8 md:p-10 shadow-2xl">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black bg-zinc-800 text-zinc-200 rounded uppercase tracking-widest">
                            Weekly Drop Pending
                        </span>
                        <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] text-white">
                            No movie has been scheduled for the current week yet.
                        </h1>
                        <p className="mt-4 text-lg text-zinc-400 max-w-2xl leading-relaxed">
                            The site is live and your account is working, but the homepage needs an active weekly drop before it can feature a film here.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            {canManageDrops ? (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black tracking-wide rounded-lg transition-colors shadow-xl"
                                >
                                    Set Up This Week&apos;s Drop
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/vote')}
                                    className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black tracking-wide rounded-lg transition-colors shadow-xl"
                                >
                                    Check Voting Page
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setPartyComingSoon(true);
                                    setTimeout(() => setPartyComingSoon(false), 2000);
                                }}
                                className={`w-full sm:w-auto px-8 py-4 rounded-lg border font-bold tracking-wide transition-all duration-300 ${
                                    partyComingSoon
                                        ? 'bg-zinc-800 border-zinc-500 text-white scale-95'
                                        : 'bg-zinc-900/60 hover:bg-zinc-800/80 text-white border-zinc-700/50'
                                }`}
                            >
                                {partyComingSoon ? 'Coming Soon...' : 'Browse Community Features'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    const bgImage = currentDrop.movie.backdrop_path 
        ? `https://image.tmdb.org/t/p/original${currentDrop.movie.backdrop_path}` 
        : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop";

    return (
        <section className="relative w-full min-h-[max(600px,85vh)] flex items-end justify-center pb-16 md:pb-24 pt-28 md:pt-36">
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
