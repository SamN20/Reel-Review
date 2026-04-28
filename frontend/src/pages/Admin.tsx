import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

import { DashboardTab } from '../features/admin/tabs/DashboardTab';
import { MoviesTab } from '../features/admin/tabs/MoviesTab';
import { DropsTab } from '../features/admin/tabs/DropsTab';

export default function Admin() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
  if (!user || !user.is_admin) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 flex flex-col p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Admin Panel</h1>
        <nav className="flex flex-col space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('movies')}
            className={`text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'movies' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            Movies
          </button>
          <button 
            onClick={() => setActiveTab('drops')}
            className={`text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'drops' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            Weekly Drops
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'movies' && <MoviesTab />}
        {activeTab === 'drops' && <DropsTab />}
      </div>
    </div>
  );
}
