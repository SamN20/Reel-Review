import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export function MovieStagingScreen({ tmdbId, onBack }: { tmdbId: number, onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
  const [selectedBackdrop, setSelectedBackdrop] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/v1/admin/tmdb/movie/${tmdbId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
        if (res.data.images?.posters?.length > 0) {
          setSelectedPoster(res.data.images.posters[0].file_path);
        }
        if (res.data.images?.backdrops?.length > 0) {
          setSelectedBackdrop(res.data.images.backdrops[0].file_path);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDetails();
  }, [tmdbId]);

  const handleImport = async () => {
    if (!data) return;
    setImporting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        tmdb_id: data.tmdb_id,
        title: data.title,
        release_date: data.release_date,
        overview: data.overview,
        poster_path: selectedPoster,
        backdrop_path: selectedBackdrop,
        genres: data.genres,
        cast: data.cast,
        keywords: data.keywords,
        watch_providers: data.watch_providers
      };
      await axios.post(`${API_URL}/api/v1/admin/movies`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Movie successfully imported!');
      onBack();
    } catch (err: any) {
      alert(`Error importing: ${err.response?.data?.detail || err.message}`);
    } finally {
      setImporting(false);
    }
  };

  if (!data) return <div className="text-white">Loading movie data...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 text-white">
      <button onClick={onBack} className="text-zinc-400 hover:text-white mb-6 flex items-center gap-2">
        &larr; Back to Search
      </button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-4xl font-bold mb-2">{data.title}</h2>
          <p className="text-zinc-400">{data.release_date} • {data.genres.map((g: any) => g.name).join(', ')}</p>
        </div>
        <button 
          onClick={handleImport}
          disabled={importing}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          {importing ? 'Importing...' : 'Save & Import Movie'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="text-xl font-semibold mb-4 text-zinc-300">Synopsis</h3>
            <p className="text-zinc-400 leading-relaxed">{data.overview}</p>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-4 text-zinc-300">Top Cast</h3>
            <div className="flex flex-wrap gap-2">
              {data.cast.map((c: any) => (
                <span key={c.id} className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-sm">
                  {c.name} ({c.character})
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="space-y-12">
        <section>
          <h3 className="text-2xl font-bold mb-6">Select Primary Poster</h3>
          <div className="flex overflow-x-auto gap-4 py-6 px-2 -mx-2 hide-scrollbar">
            {data.images.posters.map((p: any) => (
              <img 
                key={p.file_path}
                src={`https://image.tmdb.org/t/p/w500${p.file_path}`} 
                className={`h-64 object-cover rounded-lg cursor-pointer border-2 transition-all ${selectedPoster === p.file_path ? 'border-red-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                onClick={() => setSelectedPoster(p.file_path)}
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-bold mb-6">Select Primary Backdrop</h3>
          <div className="flex overflow-x-auto gap-4 py-6 px-2 -mx-2 hide-scrollbar">
            {data.images.backdrops.map((b: any) => (
              <img 
                key={b.file_path}
                src={`https://image.tmdb.org/t/p/w780${b.file_path}`} 
                className={`h-40 object-cover rounded-lg cursor-pointer border-2 transition-all ${selectedBackdrop === b.file_path ? 'border-red-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                onClick={() => setSelectedBackdrop(b.file_path)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
