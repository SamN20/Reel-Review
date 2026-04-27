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
    Trophy,
    Flame,
    Check
} from 'lucide-react';

// --- MOCK DATA ---
const MOVIE_DATA = {
    title: "Dune: Part Two",
    year: 2024,
    director: "Denis Villeneuve",
    officialScore: 88, // Adjusted to match your screenshot
    userScore: 85,    // Adjusted to match your screenshot
    totalVotes: 1204,
    img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop",
    rankings: [
        {
            id: 'all-time',
            label: "All-Time Ranking",
            rank: 4,
            isNew: true,
            badge: "Highest of 2024",
            surrounding: [
                { rank: 3, title: "Oppenheimer", score: 92 },
                { rank: 4, title: "Dune: Part Two", score: 88, isCurrent: true },
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
                { rank: 1, title: "Dune: Part Two", score: 88, isCurrent: true },
                { rank: 2, title: "Interstellar", score: 87 },
                { rank: 3, title: "Blade Runner 2049", score: 86 }
            ]
        }
    ],
    categories: [
        { label: "Visuals & Cinematography", score: 98 },
        { label: "Sound & Score", score: 96 },
        { label: "Performances", score: 88 },
        { label: "Story & Pacing", score: 85 },
        { label: "Pure Enjoyment", score: 90 },
        { label: "Emotional Impact", score: 82 },
    ],
};

const REVIEWS = [
    { user: "Nolo", score: 100, text: "An absolute masterclass in scale and sound design. It elevates the sci-fi genre to heights we haven't seen since Lord of the Rings did it for fantasy.", isSpoiler: false, likes: 342, avatar: "https://i.pravatar.cc/150?u=nolo" },
    { user: "AlexD", score: 88, text: "Incredible visuals, but the pacing in the second act dragged just a tiny bit for me. Still, a monumental achievement in theater.", isSpoiler: false, likes: 128, avatar: "https://i.pravatar.cc/150?u=alex" },
    { user: "Anonymous", score: 70, text: "I know I'm in the minority here, but I preferred the slower, more methodical pacing of Part One. This felt rushed.", isSpoiler: false, likes: 45, avatar: null }
];

export default function App() {
    const [activeTab, setActiveTab] = useState('spoiler-free');
    const [expandedRanking, setExpandedRanking] = useState('all-time');

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
                <section className="relative w-full pt-24 pb-12 md:pt-32 md:pb-16 flex flex-col justify-end min-h-[50vh]">
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

                        </div>
                    </div>
                </section>

                {/* FULL WIDTH: The Rating Spectrum (Timeline) */}
                <div className="w-full bg-zinc-950 border-y border-zinc-900 py-16 hidden md:block">
                    <div className="max-w-5xl mx-auto px-8 relative">

                        {/* The Line Gradient */}
                        <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-red-600 via-zinc-700 to-green-500 relative">

                            {/* Labels */}
                            <div className="absolute -top-8 left-0 text-xs font-bold text-zinc-500 uppercase tracking-widest">Hated It</div>
                            <div className="absolute -top-8 right-0 text-xs font-bold text-zinc-500 uppercase tracking-widest">Loved It</div>

                            {/* Average Marker (Bottom) */}
                            <div className="absolute top-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: '88%' }}>
                                <div className="w-0.5 h-8 bg-amber-400 mb-1"></div>
                                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Avg</span>
                                    <span className="text-xl font-black text-amber-400 leading-none tabular-nums">{MOVIE_DATA.officialScore}</span>
                                </div>
                            </div>

                            {/* Your Vote Marker (Top) */}
                            <div className="absolute bottom-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: '85%' }}>
                                <div className="bg-white rounded-lg p-2 shadow-xl flex flex-col items-center mb-1 border-2 border-zinc-300">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">You</span>
                                    <span className="text-2xl font-black text-zinc-950 leading-none tabular-nums">{MOVIE_DATA.userScore}</span>
                                </div>
                                <div className="w-0.5 h-8 bg-white"></div>
                            </div>

                            {/* Mock Friends Avatars on the line */}
                            <img src="https://i.pravatar.cc/150?u=1" className="w-5 h-5 rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 border-2 border-zinc-950 hover:z-10 transition-transform hover:scale-150 cursor-pointer" style={{ left: '72%' }} alt="friend" />
                            <img src="https://i.pravatar.cc/150?u=2" className="w-5 h-5 rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 border-2 border-zinc-950 hover:z-10 transition-transform hover:scale-150 cursor-pointer" style={{ left: '98%' }} alt="friend" />
                            <img src="https://i.pravatar.cc/150?u=3" className="w-5 h-5 rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 border-2 border-zinc-950 hover:z-10 transition-transform hover:scale-150 cursor-pointer" style={{ left: '40%' }} alt="friend" />
                        </div>
                    </div>
                </div>

                {/* CONTENT LAYOUT */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT COL: Analytics & Details (4 cols) */}
                    <div className="lg:col-span-4 space-y-10">

                        {/* Shareable Movie Stub */}
                        <div className="relative bg-zinc-200 text-zinc-900 rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-300 group">
                            {/* Top Art */}
                            <div className="h-32 relative overflow-hidden bg-zinc-900">
                                <img src={MOVIE_DATA.img} className="w-full h-full object-cover opacity-50 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500" alt="movie" />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent"></div>
                                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                    <h3 className="text-white font-black text-2xl tracking-tighter drop-shadow-md leading-none">{MOVIE_DATA.title}</h3>
                                    <span className="text-xs font-bold text-zinc-300 bg-zinc-950/50 backdrop-blur-sm px-2 py-1 rounded border border-zinc-700/50">{MOVIE_DATA.year}</span>
                                </div>
                            </div>

                            {/* Scores & Details */}
                            <div className="px-5 py-5 bg-zinc-100 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your Vote</p>
                                        <p className="text-5xl font-black tracking-tighter text-zinc-900 tabular-nums leading-none mt-1">{MOVIE_DATA.userScore}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Comm Avg</p>
                                        <p className="text-3xl font-bold text-zinc-700 tabular-nums leading-none mt-1">{MOVIE_DATA.officialScore}</p>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-zinc-300"></div>

                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Director</p>
                                        <p className="text-sm font-bold text-zinc-900">{MOVIE_DATA.director}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Standout Category</p>
                                        <p className="text-sm font-bold text-zinc-900 flex items-center justify-end gap-1">
                                            Visuals <span className="text-zinc-500 font-medium">(98)</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Perforated Edge */}
                            <div className="relative flex items-center justify-center h-4 bg-zinc-100">
                                <div className="w-full border-t-[3px] border-dotted border-zinc-300"></div>
                                {/* Left/Right Cutouts (matching background color) */}
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
                                    <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-[0.2em] leading-none">WK42-RR-2024</span>
                                </div>
                                <button className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md shadow-red-900/20">
                                    <Share2 size={16} /> Share Stub
                                </button>
                            </div>
                        </div>

                        {/* HALL OF FAME (Expandable Ranking Updates) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                                <Trophy className="text-amber-400" size={20} /> Hall of Fame Updates
                            </h3>

                            {MOVIE_DATA.rankings.map((ranking) => {
                                const isExpanded = expandedRanking === ranking.id;

                                return (
                                    <div key={ranking.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
                                        {/* Accordion Header */}
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

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="p-5 border-t border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row gap-5 animate-in slide-in-from-top-2 duration-200">
                                                <img src={MOVIE_DATA.img} className="w-20 h-28 object-cover rounded-lg shadow-md hidden sm:block" alt="poster" />
                                                <div className="flex-1">

                                                    {/* Status Header */}
                                                    <div className="flex justify-between items-start mb-5">
                                                        <div>
                                                            <h4 className="font-bold text-white mb-0.5">{MOVIE_DATA.title}</h4>
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

                                                    {/* Leaderboard Slice */}
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
                                                                    {item.rank}. {item.title}
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

                        {/* Sub-Category Breakdown */}
                        <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50">
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
                                                        className={`flex-1 rounded-[1px] ${isFilled ? 'bg-red-600' : isPartial ? 'bg-red-900/50' : 'bg-zinc-800'
                                                            }`}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COL: Community Takes (8 cols) */}
                    <div className="lg:col-span-8">

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <MessageSquare className="text-zinc-400" size={24} /> Community Takes
                            </h2>

                            {/* Spoiler Toggle */}
                            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 w-fit shrink-0">
                                <button
                                    onClick={() => setActiveTab('spoiler-free')}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'spoiler-free' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
                                >
                                    Spoiler-Free
                                </button>
                                <button
                                    onClick={() => setActiveTab('spoilers')}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'spoilers' ? 'bg-red-950/50 text-red-500 shadow-md border border-red-900/50' : 'text-zinc-500 hover:text-red-400'}`}
                                >
                                    <ShieldAlert size={14} /> Spoiler Zone
                                </button>
                            </div>
                        </div>

                        {activeTab === 'spoiler-free' && (
                            <>
                                {/* MATCH CARDS (Perfect Match vs Polar Opposite) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    {/* Perfect Match Card */}
                                    <div className="bg-green-950/10 border border-green-900/40 rounded-2xl p-5 flex flex-col justify-between hover:bg-green-950/20 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-widest mb-3">
                                                <Trophy size={14} /> Perfect Match
                                            </div>
                                            <p className="text-zinc-200 text-[15px] italic font-medium leading-relaxed mb-6">
                                                "Literally exactly how I felt. The pacing was flawless but the score was the real star."
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-4 border-t border-green-900/30">
                                            <img src="https://i.pravatar.cc/150?u=david" className="w-10 h-10 rounded-full border border-green-900/50" alt="user" />
                                            <div>
                                                <div className="font-bold text-white text-sm">David Chen</div>
                                                <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Rated 85 • Same As You</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Polar Opposite Card */}
                                    <div className="bg-red-950/10 border border-red-900/40 rounded-2xl p-5 flex flex-col justify-between hover:bg-red-950/20 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest mb-3">
                                                <Flame size={14} /> Polar Opposite
                                            </div>
                                            <p className="text-zinc-200 text-[15px] italic font-medium leading-relaxed mb-6">
                                                "I don't get the hype. Visuals were great but the story dragged for 2.5 hours."
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-4 border-t border-red-900/30">
                                            <img src="https://i.pravatar.cc/150?u=sarah" className="w-10 h-10 rounded-full border border-red-900/50" alt="user" />
                                            <div>
                                                <div className="font-bold text-white text-sm">Sarah M.</div>
                                                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Rated 40 • -45 Diff</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Filter / Sort Bar */}
                                <div className="flex items-center gap-5 mb-6 text-sm border-b border-zinc-900 pb-4">
                                    <button className="flex items-center gap-1.5 text-white font-semibold"><TrendingUp size={16} className="text-red-500" /> Top Rated Comments</button>
                                    <button className="text-zinc-500 hover:text-zinc-300 font-medium">Most Recent</button>
                                </div>

                                {/* Reviews List */}
                                <div className="space-y-4">
                                    {REVIEWS.map((review, i) => (
                                        <div key={i} className="p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    {review.avatar ? (
                                                        <img src={review.avatar} className="w-10 h-10 rounded-full border border-zinc-700" alt="user" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700">
                                                            <User size={20} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-zinc-200 flex items-center gap-2">
                                                            {review.user}
                                                            {i === 1 && <Award size={14} className="text-amber-500" />}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">Rated {review.score}</div>
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
                            </>
                        )}

                        {/* SPOILER ZONE STATE */}
                        {activeTab === 'spoilers' && (
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