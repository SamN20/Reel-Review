import React from 'react';
import {
    Film,
    Play,
    Search,
    Bell,
    User,
    ChevronRight,
    Clock,
    Users,
    Calendar,
    MessageSquare,
    Ticket,
    ShieldAlert
} from 'lucide-react';

export default function App() {
    return (
        <div
            className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-600 selection:text-white pb-20 overflow-x-hidden">

            {/* Navigation */}
            <nav
                className="fixed top-0 w-full z-50 px-4 md:px-8 py-5 bg-gradient-to-b from-zinc-950/90 to-transparent backdrop-blur-sm transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-2 text-red-600">
                            <Film size={28} strokeWidth={2.5} />
                            <span className="text-xl font-black tracking-tighter text-white uppercase">Reel Review</span>
                        </div>
                        <div className="hidden md:flex gap-8 text-sm font-semibold tracking-wide text-zinc-400">
                            <button className="text-white drop-shadow-md">Current Week</button>
                            <button className="hover:text-white transition-colors">The Film Shelf</button>
                            <button className="hover:text-white transition-colors">Leaderboards</button>
                            <button className="hover:text-white transition-colors">Discussions</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 text-zinc-300">
                        <button className="hover:text-white transition-colors">
                            <Search size={20} strokeWidth={2.5} />
                        </button>
                        <button className="relative hover:text-white transition-colors">
                            <Bell size={20} strokeWidth={2.5} />
                            <span
                                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-zinc-950"></span>
                        </button>
                        <button
                            className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-zinc-500 transition-colors">
                            <User size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION - THE WEEKLY DROP */}
            <main>
                <section className="relative w-full h-[85vh] min-h-[600px] flex items-end justify-center pb-16 md:pb-24">
                    {/* Background Layer */}
                    <div className="absolute inset-0 z-0">
                        <div
                            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop')] bg-cover bg-center opacity-60">
                        </div>
                        {/* Multi-layered cinematic gradients */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-transparent to-transparent">
                        </div>
                    </div>

                    {/* Hero Content */}
                    <div
                        className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:w-2/3 lg:w-1/2 mr-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <span
                                className="px-3 py-1.5 text-xs font-black bg-red-600 text-white rounded uppercase tracking-widest shadow-lg shadow-red-900/20 flex items-center gap-2">
                                Week 42 Pick
                            </span>
                            <span
                                className="flex items-center gap-1.5 text-sm font-bold text-zinc-300 drop-shadow-md bg-zinc-900/50 px-3 py-1 rounded backdrop-blur-sm border border-zinc-800">
                                <Clock size={16} className="text-red-500" /> Closes Sunday 11:59 PM
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter leading-[1.1] drop-shadow-2xl">
                            Dune: Part Two
                        </h1>

                        <p
                            className="text-lg md:text-xl text-zinc-300 mb-6 max-w-xl leading-relaxed drop-shadow-md font-medium">
                            Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the
                            conspirators who destroyed his family.
                        </p>

                        {/* Voting Stats - Averages Hidden! */}
                        <div className="flex items-center gap-6 mb-8 text-sm font-semibold text-zinc-400">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-zinc-300" />
                                <span className="text-white">1,204</span> Users Voted
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                            <div className="flex items-center gap-2">
                                <MessageSquare size={18} className="text-zinc-300" />
                                <span className="text-white">342</span> Mid-Week Takes
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <button
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black tracking-wide rounded-lg transition-colors">
                                <Play size={20} fill="currentColor" />
                                Rate This Week
                            </button>
                            <button
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900/60 hover:bg-zinc-800/80 backdrop-blur-md text-white font-bold tracking-wide rounded-lg border border-zinc-700/50 transition-colors">
                                <Users size={20} />
                                Find a Watch Party
                            </button>
                        </div>

                        {/* Intermission Hook */}
                        <button
                            className="mt-6 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors w-fit">
                            Not your vibe? <span className="underline decoration-zinc-700 underline-offset-4">Use an
                                Intermission (2 remaining)</span>
                        </button>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16 -mt-8 relative z-20">

                    {/* THE FILM SHELF (Past Weeks - Scores Revealed) */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                                    <Ticket className="text-red-600" size={24} />
                                    The Film Shelf
                                </h2>
                                <p className="text-zinc-500 text-sm mt-1">Catch up on past weeks you missed.</p>
                            </div>
                            <button
                                className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                                View Archive
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar" style={{
                            scrollbarWidth: 'none', msOverflowStyle: 'none'
                        }}>
                            {[
                                {
                                    title: "Blade Runner 2049", week: "Week 41", score: 88, img:
                                        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop"
                                },
                                {
                                    title: "Everything Everywhere", week: "Week 40", score: 94, img:
                                        "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop"
                                },
                                {
                                    title: "The Batman", week: "Week 39", score: 82, img:
                                        "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=2070&auto=format&fit=crop"
                                },
                                {
                                    title: "Interstellar", week: "Week 38", score: 91, img:
                                        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2046&auto=format&fit=crop"
                                }
                            ].map((movie, i) => (
                                <div key={i}
                                    className="min-w-[85vw] sm:min-w-[400px] aspect-[21/9] sm:aspect-[16/9] relative rounded-xl overflow-hidden group snap-start cursor-pointer border border-zinc-800/50">
                                    <div className="absolute inset-0 bg-zinc-900">
                                        <img src={movie.img} alt={movie.title}
                                            className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity duration-500" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent">
                                    </div>

                                    {/* Revealed Score Badge */}
                                    <div
                                        className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur border border-zinc-800 text-white font-black text-xl px-3 py-1.5 rounded-lg shadow-xl tabular-nums group-hover:scale-110 transition-transform">
                                        {movie.score}
                                    </div>

                                    {/* Hover Overlay Button */}
                                    <div
                                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div
                                            className="bg-red-600 text-white rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-xl shadow-red-900/50 font-bold flex items-center gap-2">
                                            <Play size={20} fill="currentColor" /> Rate
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 left-0 p-5 w-full">
                                        <div className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">{movie.week}
                                        </div>
                                        <h3
                                            className="text-xl font-bold tracking-tight text-white mb-1 group-hover:text-red-400 transition-colors">
                                            {movie.title}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* COMMUNITY DISCUSSIONS & LFG */}
                    <section className="pt-6 border-t border-zinc-900/50 grid grid-cols-1 lg:grid-cols-2 gap-12">

                        {/* Left Col: Discussions */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <MessageSquare className="text-zinc-400" size={20} />
                                <h3 className="text-xl font-bold tracking-tight text-white">Dune Part Two: Discussions</h3>
                            </div>

                            <div className="space-y-3">
                                <div
                                    className="p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 rounded-xl transition-all cursor-pointer group flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-zinc-100 mb-1">General Thoughts (Spoiler-Free)</h4>
                                        <p className="text-sm text-zinc-500">124 active members chatting</p>
                                    </div>
                                    <ChevronRight className="text-zinc-600 group-hover:text-white transition-colors" />
                                </div>

                                <div
                                    className="p-4 bg-red-950/10 hover:bg-red-950/20 border border-red-900/30 hover:border-red-800/50 rounded-xl transition-all cursor-pointer group flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-red-50 flex items-center gap-2 mb-1">
                                            <ShieldAlert size={16} className="text-red-500" />
                                            The Spoiler Zone
                                        </h4>
                                        <p className="text-sm text-zinc-500">Enter at your own risk. 89 active chats.</p>
                                    </div>
                                    <ChevronRight className="text-red-900 group-hover:text-red-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Right Col: Watch Parties */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <Calendar className="text-zinc-400" size={20} />
                                <h3 className="text-xl font-bold tracking-tight text-white">Upcoming Watch Parties</h3>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { host: "Nolo", time: "Friday, 8:00 PM EST", platform: "Discord Stream", spots: "Open" },
                                    { host: "Alex", time: "Saturday, 2:00 PM EST", platform: "Teleparty (Netflix)", spots: "2 Spots Left" }
                                ].map((party, i) => (
                                    <div key={i}
                                        className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-zinc-200">{party.host}'s Party</span>
                                                <span
                                                    className="text-xs font-semibold px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">{party.platform}</span>
                                            </div>
                                            <p className="text-sm text-zinc-500">{party.time}</p>
                                        </div>
                                        <button
                                            className="text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors">
                                            Join
                                        </button>
                                    </div>
                                ))}
                                <button
                                    className="w-full p-4 border border-dashed border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm">
                                    + Host a Watch Party
                                </button>
                            </div>
                        </div>

                    </section>

                </div>
            </main>
        </div>
    );
}