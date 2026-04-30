import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { MovieStagingScreen } from './MovieStagingScreen';
import { KanbanColumn } from '../components/KanbanColumn';

const API_URL = import.meta.env.VITE_API_URL || '';

export function MoviesTab() {
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);

  const [importedMovies, setImportedMovies] = useState<any[]>([]);
  const [drops, setDrops] = useState<any[]>([]);
  const [kanbanFilter, setKanbanFilter] = useState('');

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

  useEffect(() => {
    if (!selectedTmdbId) {
      fetchImportedMovies();
      fetchDrops();
    }
  }, [selectedTmdbId]);

  const scheduledMovieIds = useMemo(() => new Set(drops.map(d => d.movie_id).filter(Boolean)), [drops]);

  const filteredMovies = useMemo(() => {
    if (!kanbanFilter) return importedMovies;
    const q = kanbanFilter.toLowerCase();
    return importedMovies.filter(m => m.title.toLowerCase().includes(q));
  }, [importedMovies, kanbanFilter]);

  const unscheduledMovies = useMemo(
    () => filteredMovies.filter(m => !m.in_pool && !scheduledMovieIds.has(m.id)),
    [filteredMovies, scheduledMovieIds]
  );
  const poolMovies = useMemo(
    () => filteredMovies.filter(m => m.in_pool && !scheduledMovieIds.has(m.id)),
    [filteredMovies, scheduledMovieIds]
  );
  const scheduledMovies = useMemo(
    () => filteredMovies.filter(m => scheduledMovieIds.has(m.id)),
    [filteredMovies, scheduledMovieIds]
  );

  const handleTmdbSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbSearchQuery) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/v1/admin/tmdb/search?query=${tmdbSearchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTmdbSearchResults(res.data.results || []);
      setSelectedTmdbId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"? This removes all related drops and ratings.`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/v1/admin/movies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchImportedMovies();
      fetchDrops();
    } catch (err: any) {
      alert(`Error deleting: ${err.response?.data?.detail || err.message}`);
    }
  };

  const togglePool = async (movieId: number, inPool: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/v1/admin/movies/${movieId}/pool`, { in_pool: inPool }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchImportedMovies();
    } catch (err: any) {
      alert(`Error updating pool: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDropToUnscheduled = (movie: any) => {
    if (movie.in_pool) {
      togglePool(movie.id, false);
    }
  };

  const handleDropToPool = (movie: any) => {
    if (!movie.in_pool) {
      togglePool(movie.id, true);
    }
  };

  const handleDropToScheduled = (movie: any) => {
    alert(`To schedule "${movie.title}", use the Weekly Drops calendar tab to assign it to a specific week.`);
  };

  if (selectedTmdbId) {
    return <MovieStagingScreen tmdbId={selectedTmdbId} onBack={() => { setSelectedTmdbId(null); fetchImportedMovies(); }} />;
  }

  return (
    <div>
      {/* TMDB Import Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Import from TMDB</h2>
        <form onSubmit={handleTmdbSearch} className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={tmdbSearchQuery}
            onChange={(e) => setTmdbSearchQuery(e.target.value)}
            placeholder="Search TMDB for a movie to import..."
            className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
          />
          <button type="submit" className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Search
          </button>
        </form>

        {tmdbSearchResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {tmdbSearchResults.map((movie) => (
              <div key={movie.id} className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 group cursor-pointer hover:border-red-500 transition-colors" onClick={() => setSelectedTmdbId(movie.id)}>
                {movie.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} alt={movie.title} className="w-full aspect-[2/3] object-cover group-hover:opacity-75 transition-opacity" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center p-4 text-center text-sm text-zinc-500">No Poster</div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-white text-sm line-clamp-1">{movie.title}</h3>
                  <p className="text-xs text-zinc-400">{movie.release_date?.substring(0, 4)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 mb-8" />

      {/* Kanban Board */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold">Movie Database</h2>
            <p className="text-sm text-zinc-500">Drag and drop movies between zones to manage their status.</p>
          </div>
          <div className="relative w-full md:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeWidth="2" d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              value={kanbanFilter}
              onChange={(e) => setKanbanFilter(e.target.value)}
              placeholder="Filter movies..."
              className="w-full bg-zinc-900 border border-zinc-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <KanbanColumn
            title="Unscheduled"
            subtitle="Movies in the database not yet assigned anywhere"
            accentColor="zinc"
            movies={unscheduledMovies}
            onDrop={handleDropToUnscheduled}
            onDeleteMovie={handleDelete}
            emptyMessage="No unscheduled movies. Import some from TMDB above!"
            compact
          />
          <KanbanColumn
            title="The Pool"
            subtitle="Available for random draws & community voting"
            accentColor="amber"
            movies={poolMovies}
            onDrop={handleDropToPool}
            onDeleteMovie={handleDelete}
            emptyMessage="Drag movies here to add them to the selection pool"
            compact
          />
          <KanbanColumn
            title="Scheduled"
            subtitle="Assigned to a specific week on the calendar"
            accentColor="red"
            movies={scheduledMovies}
            onDrop={handleDropToScheduled}
            emptyMessage="Schedule movies from the Weekly Drops tab"
            compact
          />
        </div>
      </div>
    </div>
  );
}
