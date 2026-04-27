import React, { useState } from 'react';
import {
    Film,
    Search,
    User,
    Star,
    Users,
    MessageSquare,
    ShieldAlert,
    ArrowLeft,
    Share2,
    TrendingUp,
    Activity,
    Award,
    ChevronDown,
    Trophy
} from 'lucide-react';

// --- MOCK DATA ---
const MOVIE_DATA = {
    title: "Dune: Part Two",
    year: 2024,
    director: "Denis Villeneuve",
    officialScore: 92,
    userScore: 90,
    totalVotes: 1204,
    rankings: [
        { label: "All-Time", rank: 8 },
        { label: "Sci-Fi Epics", rank: 1 }
    ],
    categories: [
        { label: "Visuals & Cinematography", score: 98 },
        { label: "Sound & Score", score: 96 },
        { label: "Performances", score: 88 },
        { label: "Story & Pacing", score: 85 },
        { label: "Pure Enjoyment", score: 90 },
        { label: "Emotional Impact", score: 82 },
    ],
    img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop"
};

const REVIEWS = [
    { user: "Nolo", score: 100, text: "An absolute masterclass in scale and sound design. It elevates the sci-fi genre to heights we haven't seen since Lord of the Rings did it for fantasy.", isSpoiler: false, likes: 342 },
    { user: "AlexD", score: 90, text: "Incredible visuals, but the pacing in the second act dragged just a tiny bit for me. Still, a monumental achievement in theater.", isSpoiler: false, likes: 128 },
    { user: "Anonymous", score: 70, text: "I know I'm in the minority here, but I preferred the slower, more methodical pacing of Part One. This felt rushed.", isSpoiler: false, likes: 45 }
];

export default function App() {
    const [activeTab, setActiveTab] = useState('spoiler-free');

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-600 selection:text-white pb-20 overflow-x-hidden">

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-2 text-red-600">
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
                {/* HERO: The Grand Reveal */}
                <section className="relative w-full pt-24 pb-12 md:pt-32 md:pb-16 flex flex-col justify-end min-h-[60vh]">
                    {/* Background Layer */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
                        <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-semibold text-sm mb-8 w-fit">
                            <ArrowLeft size={16} /> Back to Archive
                        </button>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">

                            {/* Left: Movie Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-2.5 py-1 text-xs font-bold bg-zinc-800 text-zinc-300 rounded border border-zinc-700">Week 42 Results</span>
                                    <span className="text-sm font-semibold text-zinc-400">{MOVIE_DATA.year}</span>
                                </div>

                                <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter leading-none text-white drop-shadow-lg">
                                    {MOVIE_DATA.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-zinc-400">
                                    <span>Dir. {MOVIE_DATA.director}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                                    <span className="flex items-center gap-1.5 text-zinc-300">
                                        <Users size={16} /> {MOVIE_DATA.totalVotes.toLocaleString()} Votes Cast
                                    </span>
                                </div>
                            </div>

                            {/* Right: The Score Comparison */}
                            <div className="flex items-center gap-6 md:gap-10 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 md:p-8 shrink-0">

                                {/* Official Score */}
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <Star size={12} fill="currentColor" /> Official Score
                                    </span>
                                    <div className="text-6xl md:text-7xl font-black text-white tabular-nums leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                                        {MOVIE_DATA.officialScore}
                                    </div>
                                </div>

                                <div className="w-px h-20 bg-zinc-800 hidden sm:block"></div>

                                {/* User Score */}
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                        Your Vote
                                    </span>
                                    <div className={`text-4xl md:text-5xl font-black tabular-nums leading-none tracking-tighter ${MOVIE_DATA.userScore >= MOVIE_DATA.officialScore ? 'text-green-400' : 'text-amber-400'}`}>
                                        {MOVIE_DATA.userScore}
                                    </div>
                                    <span className="text-xs font-semibold text-zinc-500 mt-2">
                                        {Math.abs(MOVIE_DATA.officialScore - MOVIE_DATA.userScore)} pts {MOVIE_DATA.userScore > MOVIE_DATA.officialScore ? 'higher' : 'lower'}
                                    </span>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>

                {/* CONTENT LAYOUT */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT COL: Analytics & Details (4 cols) */}
                    <div className="lg:col-span-4 space-y-10">

                        {/* Leaderboard Context */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Trophy className="text-amber-400" size={20} /> Hall of Fame
                            </h3>
                            <div className="space-y-2">
                                {MOVIE_DATA.rankings.map((rank, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                        <span className="font-semibold text-zinc-300">{rank.label}</span>
                                        <span className="font-black text-white bg-zinc-800 px-2 py-0.5 rounded text-sm">#{rank.rank}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sub-Category Breakdown */}
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                <Activity className="text-red-500" size={20} /> The Breakdown
                            </h3>

                            <div className="space-y-5">
                                {MOVIE_DATA.categories.map((cat, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-semibold text-zinc-300">{cat.label}</span>
                                            <span className="font-bold text-zinc-400 tabular-nums">{cat.score}</span>
                                        </div>
                                        {/* Segmented Progress Bar visually mirroring the voting UI */}
                                        <div className="flex gap-0.5 h-2.5">
                                            {[...Array(10)].map((_, blockIdx) => {
                                                const blockValue = (blockIdx + 1) * 10;
                                                const isFilled = cat.score >= blockValue;
                                                const isPartial = cat.score > (blockValue - 10) && cat.score < blockValue;

                                                return (
                                                    <div
                                                        key={blockIdx}
                                                        className={`flex-1 rounded-sm ${isFilled ? 'bg-red-600' : isPartial ? 'bg-red-900/50' : 'bg-zinc-800'
                                                            }`}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Share / Action */}
                        <button className="w-full py-4 rounded-xl font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-center gap-2 text-zinc-300">
                            <Share2 size={18} /> Share Results
                        </button>
                        <p className="text-xs text-center text-zinc-500">Late votes remain open, but the official Week 42 score is locked.</p>

                    </div>

                    {/* RIGHT COL: Community Takes (8 cols) */}
                    <div className="lg:col-span-8">

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <MessageSquare className="text-zinc-400" size={24} /> Community Takes
                            </h2>

                            {/* Spoiler Toggle */}
                            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 w-fit">
                                <button
                                    onClick={() => setActiveTab('spoiler-free')}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'spoiler-free' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
                                >
                                    Spoiler-Free
                                </button>
                                <button
                                    onClick={() => setActiveTab('spoilers')}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'spoilers' ? 'bg-red-950/50 text-red-500 shadow-md border border-red-900/50' : 'text-zinc-500 hover:text-red-400'}`}
                                >
                                    <ShieldAlert size={14} /> Spoiler Zone
                                </button>
                            </div>
                        </div>

                        {/* Filter / Sort Bar */}
                        <div className="flex items-center gap-4 mb-6 text-sm">
                            <button className="flex items-center gap-1.5 text-white font-semibold"><TrendingUp size={16} className="text-red-500" /> Top Rated</button>
                            <button className="text-zinc-500 hover:text-zinc-300 font-medium">Most Recent</button>
                            <button className="text-zinc-500 hover:text-zinc-300 font-medium">Controversial</button>
                        </div>

                        {/* Reviews List */}
                        {activeTab === 'spoiler-free' ? (
                            <div className="space-y-4">
                                {REVIEWS.map((review, i) => (
                                    <div key={i} className="p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-200 flex items-center gap-2">
                                                        {review.user}
                                                        {i === 0 && <Award size={14} className="text-amber-500" />}
                                                    </div>
                                                    <div className="text-xs text-zinc-500">Rated exactly at the average</div>
                                                </div>
                                            </div>

                                            {/* User's Score Pill */}
                                            <div className={`px-3 py-1 rounded-lg text-sm font-black tabular-nums border ${review.score >= MOVIE_DATA.officialScore ? 'bg-green-950/30 text-green-400 border-green-900/50' : 'bg-amber-950/30 text-amber-500 border-amber-900/50'
                                                }`}>
                                                {review.score}
                                            </div>
                                        </div>

                                        <p className="text-zinc-300 leading-relaxed text-[15px]">
                                            {review.text}
                                        </p>

                                        <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center gap-4">
                                            <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5">
                                                <TrendingUp size={14} /> {review.likes}
                                            </button>
                                            <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5">
                                                <MessageSquare size={14} /> Reply
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button className="w-full py-4 text-sm font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-2 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-600 transition-colors">
                                    Load More Takes <ChevronDown size={16} />
                                </button>
                            </div>
                        ) : (
                            // Spoiler Zone State
                            <div className="p-12 border border-red-900/50 bg-red-950/10 rounded-2xl flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                                <ShieldAlert size={48} className="text-red-600 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">You are entering the Spoiler Zone</h3>
                                <p className="text-zinc-400 max-w-md mb-6">
                                    Reviews in this section discuss major plot points, twists, and endings. Do not proceed if you haven't seen the film.
                                </p>
                                <button className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors">
                                    Acknowledge & Reveal Spoilers
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}