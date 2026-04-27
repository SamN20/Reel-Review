import React from 'react';
import {
    Film,
    Search,
    User,
    ChevronRight,
    Play,
    CheckCircle2,
    Activity,
    Trophy,
    Sparkles,
    Ticket,
    Flame
} from 'lucide-react';

// --- MOCK DATA ---
const MISSED_MOVIES = [
    { id: 2, week: 40, title: "Everything Everywhere", score: 94, userScore: null, year: 2022, img: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" },
    { id: 5, week: 37, title: "Parasite", score: 96, userScore: null, year: 2019, img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop" },
    { id: 7, week: 32, title: "Spider-Man: Across the Spider-Verse", score: 92, userScore: null, year: 2023, img: "https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=2070&auto=format&fit=crop" },
];

const TOP_RATED = [
    { id: 5, rank: 1, week: 37, title: "Parasite", score: 96, userScore: null, year: 2019, img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop" },
    { id: 2, rank: 2, week: 40, title: "Everything Everywhere", score: 94, userScore: null, year: 2022, img: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" },
    { id: 4, rank: 3, week: 38, title: "Interstellar", score: 91, userScore: 100, year: 2014, img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2046&auto=format&fit=crop" },
    { id: 6, rank: 4, week: 36, title: "Mad Max: Fury Road", score: 89, userScore: 90, year: 2015, img: "https://images.unsplash.com/photo-1533561797500-4bad472859aa?q=80&w=2070&auto=format&fit=crop" },
];

const RECOMMENDED = [
    { id: 1, week: 41, title: "Blade Runner 2049", score: 88, userScore: 90, year: 2017, img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop" },
    { id: 8, week: 24, title: "Dune: Part One", score: 87, userScore: 90, year: 2021, img: "https://images.unsplash.com/photo-1542998967-ba7145452d15?q=80&w=2070&auto=format&fit=crop" },
    { id: 9, week: 18, title: "Arrival", score: 90, userScore: 100, year: 2016, img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" },
];

const DIVISIVE = [
    { id: 10, week: 12, title: "Mother!", score: 62, userScore: 40, year: 2017, img: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=2070&auto=format&fit=crop" },
    { id: 11, week: 5, title: "Skinamarink", score: 55, userScore: null, year: 2022, img: "https://images.unsplash.com/photo-1505635552518-3448ff116af3?q=80&w=2070&auto=format&fit=crop" },
];


export default function App() {

    // Reusable component for a scrolling row of movies
    const ShelfRow = ({ title, icon: Icon, movies, showRank = false, highlightMissed = false }) => (
        <section className="mb-12">
            <div className="flex items-center justify-between px-4 md:px-8 mb-4 group cursor-pointer">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="text-red-600" size={22} />}
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-zinc-300 transition-colors">
                        {title}
                    </h2>
                </div>
                <div className="flex items-center text-sm font-bold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                    Explore All <ChevronRight size={16} />
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {movies.map((movie, idx) => (
                    <div
                        key={movie.id}
                        className="min-w-[75vw] sm:min-w-[320px] md:min-w-[380px] lg:min-w-[420px] aspect-[16/9] relative rounded-xl overflow-hidden group snap-start cursor-pointer border border-zinc-800/60 hover:border-zinc-500 transition-colors bg-zinc-900"
                    >
                        {/* Background Image */}
                        <img
                            src={movie.img}
                            alt={movie.title}
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${movie.userScore ? 'opacity-40 group-hover:opacity-30' : 'opacity-70 group-hover:scale-105 group-hover:opacity-50'
                                }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent"></div>

                        {/* Catch-Up Prompt Overlay (If missed AND highlightMissed is true) */}
                        {!movie.userScore && highlightMissed && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                <button className="bg-red-600 text-white rounded-full px-6 py-3 font-bold flex items-center gap-2 transform scale-90 group-hover:scale-100 transition-transform shadow-xl shadow-red-900/50">
                                    <Play size={18} fill="currentColor" /> Rate Now
                                </button>
                            </div>
                        )}

                        {/* Standard Hover Rate Button (If not highlighting missed specifically) */}
                        {!movie.userScore && !highlightMissed && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                <div className="bg-white/10 backdrop-blur-md text-white rounded-full p-4 border border-white/20 transform scale-90 group-hover:scale-100 transition-transform shadow-xl">
                                    <Play size={24} fill="currentColor" className="ml-1" />
                                </div>
                            </div>
                        )}

                        {/* Official Score Badge (Top Right) */}
                        <div className="absolute top-4 right-4 z-10 flex flex-col items-center bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 rounded-lg p-2 shadow-xl group-hover:scale-110 transition-transform">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Avg</span>
                            <span className="text-lg font-black text-white tabular-nums leading-none">{movie.score}</span>
                        </div>

                        {/* Week Label (Top Left) */}
                        <div className="absolute top-4 left-4 z-10 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-zinc-800/80 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                            Week {movie.week}
                        </div>

                        {/* Leaderboard Rank Indicator (If applicable) */}
                        {showRank && movie.rank && (
                            <div className="absolute -bottom-4 -left-4 z-0 text-9xl font-black text-white/10 select-none pointer-events-none">
                                {movie.rank}
                            </div>
                        )}

                        {/* Metadata Footer */}
                        <div className="absolute bottom-0 left-0 w-full p-5 z-10">
                            <h3 className="text-xl font-bold tracking-tight text-white mb-3 truncate group-hover:text-red-400 transition-colors drop-shadow-md">{movie.title}</h3>

                            {/* User Status Bar */}
                            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                                {movie.userScore ? (
                                    <>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                                            <CheckCircle2 size={14} className="text-green-500" /> Rated
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">You:</span>
                                            <span className={`text-xs font-black tabular-nums px-2 py-1 rounded bg-zinc-800 ${movie.userScore >= movie.score ? 'text-green-400' : 'text-amber-500'}`}>
                                                {movie.userScore}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={`flex items-center gap-1.5 text-xs font-bold ${highlightMissed ? 'text-red-500' : 'text-zinc-400'}`}>
                                            <Activity size={14} /> Missed Week
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">
                                            Open for votes
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-600 selection:text-white pb-10">

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-4 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-2 text-red-600">
                            <Film size={28} strokeWidth={2.5} />
                            <span className="text-xl font-black tracking-tighter text-white uppercase hidden sm:block">Reel Review</span>
                        </div>
                        <div className="hidden md:flex gap-8 text-sm font-semibold tracking-wide text-zinc-400">
                            <button className="hover:text-white transition-colors">Current Week</button>
                            <button className="text-white drop-shadow-md">The Film Shelf</button>
                            <button className="hover:text-white transition-colors">Discussions</button>
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

            {/* Main Content Area */}
            <main className="pt-24 pb-12 overflow-hidden">

                {/* Dynamic Shelves */}
                {/* Shelf 1: Highly prioritized catch-up mechanic */}
                <ShelfRow
                    title="Missed By You"
                    icon={Activity}
                    movies={MISSED_MOVIES}
                    highlightMissed={true}
                />

                {/* Shelf 2: A Leaderboard presented as a row */}
                <ShelfRow
                    title="Top Rated Overall"
                    icon={Trophy}
                    movies={TOP_RATED}
                    showRank={true}
                />

                {/* Shelf 3: Recommendation Engine output */}
                <ShelfRow
                    title="Because you liked Sci-Fi Epics"
                    icon={Sparkles}
                    movies={RECOMMENDED}
                />

                {/* Shelf 4: Standard Chronological view */}
                <ShelfRow
                    title="The Complete Archive"
                    icon={Ticket}
                    movies={[...RECOMMENDED, ...TOP_RATED]} // Just merging data for mockup
                />

                {/* Shelf 5: Another specialized Leaderboard */}
                <ShelfRow
                    title="Most Divisive Votes"
                    icon={Flame}
                    movies={DIVISIVE}
                />

            </main>
        </div>
    );
}