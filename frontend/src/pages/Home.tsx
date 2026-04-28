import { useState, useEffect } from 'react';
import axios from 'axios';
import { Film, Search, Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HeroSection } from '../components/HeroSection';
import { FilmShelf } from '../components/FilmShelf';
import { CommunityDiscussions } from '../components/CommunityDiscussions';

export default function Home() {
    const { user, loading: authLoading, login, logout } = useAuth();
    
    const [currentDrop, setCurrentDrop] = useState(null);
    const [pastDrops, setPastDrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [navComingSoon, setNavComingSoon] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const currentRes = await axios.get(`${API_URL}/api/v1/drops/current`);
                setCurrentDrop(currentRes.data);
            } catch (err) {
                console.error("Failed to fetch current drop", err);
            }

            try {
                const headers = user ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {};
                const pastRes = await axios.get(`${API_URL}/api/v1/drops/past`, { headers });
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

    const handleNavClick = (feature: string) => {
        setNavComingSoon(feature);
        setTimeout(() => setNavComingSoon(null), 2000);
    };

    if (authLoading || loading) {
        return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading...</div>;
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
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-600 selection:text-white pb-20 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-5 bg-gradient-to-b from-zinc-950/90 to-transparent backdrop-blur-sm transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-2 text-red-600">
                            <Film size={28} strokeWidth={2.5} />
                            <span className="text-xl font-black tracking-tighter text-white uppercase">Reel Review</span>
                        </div>
                        <div className="hidden md:flex gap-8 text-sm font-semibold tracking-wide text-zinc-400">
                            <button className="text-white drop-shadow-md">Current Week</button>
                            <button 
                                className={`transition-colors ${navComingSoon === 'shelf' ? 'text-red-500 animate-pulse' : 'hover:text-white'}`}
                                onClick={() => handleNavClick('shelf')}
                            >
                                {navComingSoon === 'shelf' ? 'Coming Soon' : 'The Film Shelf'}
                            </button>
                            <button 
                                className={`transition-colors ${navComingSoon === 'leader' ? 'text-red-500 animate-pulse' : 'hover:text-white'}`}
                                onClick={() => handleNavClick('leader')}
                            >
                                {navComingSoon === 'leader' ? 'Coming Soon' : 'Leaderboards'}
                            </button>
                            <button 
                                className={`transition-colors ${navComingSoon === 'disc' ? 'text-red-500 animate-pulse' : 'hover:text-white'}`}
                                onClick={() => handleNavClick('disc')}
                            >
                                {navComingSoon === 'disc' ? 'Coming Soon' : 'Discussions'}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 text-zinc-300">
                        <button onClick={() => handleNavClick('search')} className={`transition-colors ${navComingSoon === 'search' ? 'text-red-500' : 'hover:text-white'}`}>
                            <Search size={20} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleNavClick('bell')} className={`relative transition-colors ${navComingSoon === 'bell' ? 'text-red-500' : 'hover:text-white'}`}>
                            <Bell size={20} strokeWidth={2.5} />
                        </button>
                        <button onClick={logout} title="Logout" className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-zinc-500 transition-colors">
                            <User size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            <main>
                <HeroSection currentDrop={currentDrop} />

                <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16 -mt-8 relative z-20">
                    <FilmShelf pastDrops={pastDrops} />
                    <CommunityDiscussions />
                </div>
            </main>
        </div>
    );
}
