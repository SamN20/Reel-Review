import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { Loader2, Clapperboard, Users } from "lucide-react";

interface CrewMovie {
  id: number;
  title: string;
  poster_path: string | null;
  drop_id: number | null;
}

export default function PersonPage({ type }: { type: "actor" | "director" }) {
  const { name } = useParams<{ name: string }>();
  const [movies, setMovies] = useState<CrewMovie[]>([]);
  const [actorPfp, setActorPfp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const decodedName = name ? decodeURIComponent(name) : "";
  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const endpoint = type === "actor" ? `/api/v1/movies/actor/${name}` : `/api/v1/movies/director/${name}`;
        const res = await axios.get(`${API_URL}${endpoint}`);
        
        if (type === "actor") {
          setMovies(res.data.movies);
          setActorPfp(res.data.actor.profile_path);
        } else {
          setMovies(res.data);
        }
      } catch (error) {
        console.error(`Failed to fetch movies for ${decodedName}`, error);
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      fetchMovies();
    }
  }, [name, type, API_URL]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-zinc-950 to-zinc-950 z-0" />
        <div className="relative z-10 max-w-6xl mx-auto flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-xl overflow-hidden">
            {type === "actor" && actorPfp ? (
              <img src={`https://image.tmdb.org/t/p/w185${actorPfp}`} alt={decodedName} className="w-full h-full object-cover" />
            ) : type === "actor" ? (
              <Users className="w-10 h-10 text-zinc-600" />
            ) : (
              <Clapperboard className="w-10 h-10 text-zinc-600" />
            )}
          </div>
          <div>
            <p className="text-red-500 font-bold tracking-[0.2em] uppercase text-sm mb-2">{type}</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">{decodedName}</h1>
            <p className="text-zinc-400 mt-2">{movies.length} associated {movies.length === 1 ? 'movie' : 'movies'}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => {
              const posterUrl = movie.poster_path 
                ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` 
                : "https://via.placeholder.com/342x513.png?text=No+Poster";

              const card = (
                <div className="group relative rounded-xl overflow-hidden aspect-[2/3] bg-zinc-900 border border-zinc-800 block shadow-lg">
                  <img 
                    src={posterUrl} 
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <h3 className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">{movie.title}</h3>
                  </div>
                </div>
              );

              if (!movie.drop_id) {
                return <div key={movie.id}>{card}</div>;
              }

              return (
                <Link key={movie.id} to={`/results/${movie.drop_id}`} className="block">
                  {card}
                </Link>
              );
            })}
            {movies.length === 0 && (
              <div className="col-span-full text-center py-12 text-zinc-500">
                No movies found for this {type}.
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
