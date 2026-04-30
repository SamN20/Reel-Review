import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

import { DashboardTab } from '../features/admin/tabs/DashboardTab';
import { MoviesTab } from '../features/admin/tabs/MoviesTab';
import { DropsTab } from '../features/admin/tabs/DropsTab';
import { UsersTab } from '../features/admin/tabs/UsersTab';
import { ModerationTab } from '../features/admin/tabs/ModerationTab';

export default function Admin() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };
  
  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
  if (!user || !user.is_admin) return <Navigate to="/" />;

  return (
    <div className="min-h-screen md:h-screen bg-zinc-950 text-white flex flex-col md:flex-row md:overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-zinc-900 flex flex-col border-r border-zinc-800 p-5 md:static md:z-auto md:w-64 md:h-screen md:flex-shrink-0 md:overflow-y-auto md:overscroll-contain md:p-6 transform transition-transform duration-300 ease-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800"
            aria-label="Close admin menu"
          >
            Close
          </button>
        </div>
        <nav className="flex flex-col space-y-2">
          <button 
            onClick={() => handleTabChange('dashboard')}
            className={`text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => handleTabChange('movies')}
            className={`text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'movies' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            Movies
          </button>
          <button 
            onClick={() => handleTabChange('drops')}
            className={`text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'drops' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            Weekly Drops
          </button>
          <button 
            onClick={() => handleTabChange('users')}
            className={`text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            Users
          </button>
          <button 
            onClick={() => handleTabChange('moderation')}
            className={`text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'moderation' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            Moderation
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 md:h-screen p-4 sm:p-6 lg:p-8 pt-4 md:pt-8 md:overflow-y-auto md:overscroll-contain custom-scrollbar">
        <div className="md:hidden flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-1">Admin</p>
            <h1 className="text-2xl font-bold tracking-tight">Control Center</h1>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            aria-label="Open admin menu"
          >
            Menu
          </button>
        </div>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'movies' && <MoviesTab />}
        {activeTab === 'drops' && <DropsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'moderation' && <ModerationTab />}
      </div>
    </div>
  );
}
