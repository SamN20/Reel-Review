import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const MODE_LABELS: Record<string, { label: string; description: string }> = {
  admin_pick:  { label: 'Admin Pick',   description: 'Directly selected by admin (locked)' },
  user_vote:   { label: 'User Vote',    description: 'Community votes from the pool' },
  random_pool: { label: 'Random Pool',  description: 'Random draw from the pool' },
  theme_week:  { label: 'Theme Week',   description: 'Themed selection (coming soon)' },
  algorithmic: { label: 'Algorithmic',  description: 'AI-optimized pick (coming soon)' },
};

const FLEXIBLE_MODES = ['user_vote', 'random_pool'];

export function DropsTab() {
  const [drops, setDrops] = useState<any[]>([]);
  const [importedMovies, setImportedMovies] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  
  const [selectedMovieId, setSelectedMovieId] = useState<number | ''>('');
  const [selectionMode, setSelectionMode] = useState('admin_pick');
  const [movieSearch, setMovieSearch] = useState('');

  const fetchDrops = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/v1/admin/drops`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrops(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchImportedMovies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/v1/admin/movies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImportedMovies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrops();
    fetchImportedMovies();
  }, []);

  const getUpcomingWeeks = () => {
    const weeks = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    let currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + offsetToMonday);
    currentMonday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      const start = new Date(currentMonday);
      start.setDate(currentMonday.getDate() + (i * 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      
      weeks.push({ start: startStr, end: endStr, dateObj: start });
    }
    return weeks;
  };

  const upcomingWeeks = getUpcomingWeeks();

  const isFlexible = FLEXIBLE_MODES.includes(selectionMode);

  const handleOpenModal = (startStr?: string) => {
    setSelectedMovieId('');
    setSelectionMode('admin_pick');
    setMovieSearch('');
    if (startStr) {
      setSelectedWeekStart(startStr);
    } else {
      const scheduledStarts = drops.map(d => d.start_date);
      const nextOpen = upcomingWeeks.find(w => !scheduledStarts.includes(w.start));
      setSelectedWeekStart(nextOpen ? nextOpen.start : null);
    }
    setShowModal(true);
  };

  const handleScheduleDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWeekStart) return;
    if (!isFlexible && !selectedMovieId) return;

    const end = new Date(selectedWeekStart);
    end.setDate(end.getDate() + 6);
    const endStr = end.toISOString().split('T')[0];

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/v1/admin/drops`, {
        movie_id: isFlexible ? null : Number(selectedMovieId),
        start_date: selectedWeekStart,
        end_date: endStr,
        mode: selectionMode,
        is_active: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchDrops();
    } catch (err: any) {
      alert(`Error scheduling drop: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDeleteDrop = async (id: number) => {
    if (!window.confirm('Delete this scheduled drop?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/v1/admin/drops/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDrops();
    } catch (err: any) {
      alert(`Error deleting drop: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleActivateDrop = async (id: number) => {
    if (!window.confirm('Set this as the CURRENT active drop? This will deactivate the existing active drop.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/v1/admin/drops/${id}/active`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDrops();
    } catch (err: any) {
      alert(`Error activating drop: ${err.response?.data?.detail || err.message}`);
    }
  };

  const filteredModalMovies = movieSearch
    ? importedMovies.filter(m => m.title.toLowerCase().includes(movieSearch.toLowerCase()))
    : importedMovies;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Drops Calendar</h2>
          <p className="text-zinc-400 text-sm">Schedule and manage weekly movie drops. 12-week look-ahead.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-red-900/20"
        >
          + Next Open Week
        </button>
      </div>

      {/* Calendar */}
      <div className="space-y-4">
        {upcomingWeeks.map((week, idx) => {
          const drop = drops.find(d => d.start_date === week.start);
          const isThisWeek = idx === 0;
          const mode = drop ? (MODE_LABELS[drop.mode] || MODE_LABELS.admin_pick) : null;
          const isLocked = drop && !FLEXIBLE_MODES.includes(drop.mode);

          return (
            <div
              key={week.start}
              className={`rounded-xl border p-5 flex flex-col md:flex-row gap-5 items-center transition-all duration-300 ${
                drop?.is_active
                  ? 'border-red-500 bg-red-950/20 shadow-lg shadow-red-900/10'
                  : isThisWeek
                  ? 'border-zinc-700 bg-zinc-900'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              {/* Date */}
              <div className="min-w-44 text-center md:text-left">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isThisWeek ? 'text-red-500' : 'text-zinc-500'}`}>
                  {isThisWeek ? 'This Week' : `Week ${idx + 1}`}
                </p>
                <p className="text-lg font-bold text-white">
                  {week.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(week.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 w-full">
                {drop ? (
                  <div className="flex flex-col md:flex-row items-center gap-5 bg-zinc-950/80 p-4 rounded-lg border border-zinc-800">
                    {/* Poster or Placeholder */}
                    {drop.movie_id && drop.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w200${drop.poster_path}`} alt={drop.movie_title} className="w-14 rounded shadow-md flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-20 bg-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">TBD</span>
                      </div>
                    )}

                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                        <h4 className="text-lg font-bold text-white">
                          {drop.movie_title || 'To Be Determined'}
                        </h4>
                        {drop.is_active && (
                          <span className="bg-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-widest">Live</span>
                        )}
                        {isLocked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest bg-zinc-700 text-zinc-300">Locked</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest bg-amber-900/50 text-amber-400 border border-amber-800">Flexible</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">
                        {mode?.label} <span className="text-zinc-700 mx-1">/</span> {mode?.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 min-w-28 w-full md:w-auto">
                      {!drop.is_active && (
                        <button onClick={() => handleActivateDrop(drop.id)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded text-xs transition-all duration-300 border border-zinc-700">Set Active</button>
                      )}
                      <button onClick={() => handleDeleteDrop(drop.id)} className="text-red-500 hover:text-red-400 text-xs font-medium transition-colors">Delete</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleOpenModal(week.start)}
                    className="w-full border-2 border-dashed border-zinc-700 hover:border-red-500 hover:bg-zinc-800/50 text-zinc-500 hover:text-white rounded-lg p-5 flex items-center justify-center gap-2 transition-all duration-300 font-medium"
                  >
                    <span className="text-lg">+</span> Schedule Drop
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold tracking-tight mb-6 text-white">Schedule Movie Drop</h3>
            <form onSubmit={handleScheduleDrop} className="space-y-6">
              {/* Week */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Week Starting (Monday)</label>
                <input 
                  type="date" 
                  value={selectedWeekStart || ''} 
                  onChange={(e) => setSelectedWeekStart(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
              </div>

              {/* Mode */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Selection Mode</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(MODE_LABELS).map(([key, info]) => {
                    const disabled = key === 'theme_week' || key === 'algorithmic';
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={disabled}
                        onClick={() => { setSelectionMode(key); if (FLEXIBLE_MODES.includes(key)) setSelectedMovieId(''); }}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-300 ${
                          selectionMode === key
                            ? 'border-red-500 bg-red-950/30'
                            : disabled
                            ? 'border-zinc-800 bg-zinc-950/50 opacity-40 cursor-not-allowed'
                            : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{info.label}</p>
                          <p className="text-xs text-zinc-500">{info.description}</p>
                        </div>
                        {selectionMode === key && (
                          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Movie selector (only for locked modes) */}
              {!isFlexible && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Select Movie</label>
                  <div className="relative mb-2">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeWidth="2" d="m21 21-4.35-4.35"/></svg>
                    <input
                      type="text"
                      value={movieSearch}
                      onChange={(e) => setMovieSearch(e.target.value)}
                      placeholder="Search imported movies..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-zinc-950 rounded-lg border border-zinc-800 p-2">
                    {filteredModalMovies.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMovieId(m.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all duration-300 ${
                          selectedMovieId === m.id ? 'bg-red-950/40 border border-red-500/50' : 'hover:bg-zinc-800 border border-transparent'
                        }`}
                      >
                        {m.poster_path ? (
                          <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} className="w-8 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-8 h-12 bg-zinc-800 rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{m.title}</p>
                          <p className="text-xs text-zinc-500">{m.release_date?.substring(0, 4)}</p>
                        </div>
                        {selectedMovieId === m.id && (
                          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                    ))}
                    {filteredModalMovies.length === 0 && (
                      <p className="text-center text-zinc-600 text-sm py-4">No movies found</p>
                    )}
                  </div>
                </div>
              )}

              {isFlexible && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Flexible Drop</p>
                  <p className="text-zinc-500 text-xs">The movie for this week will be determined by the {MODE_LABELS[selectionMode]?.label} system using movies from The Pool.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300">Cancel</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-red-900/20">Schedule Drop</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
