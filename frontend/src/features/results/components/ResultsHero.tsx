import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MovieMetaDetails } from '../../../components/MovieMetaDetails';
import type { MovieSummary } from '../api';

interface ResultsHeroProps {
  movie: MovieSummary;
  totalVotes: number;
  officialScore: number;
  userScore: number | null;
}

export function ResultsHero({ movie, totalVotes, officialScore, userScore }: ResultsHeroProps) {
  const navigate = useNavigate();

  const bgImage = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop";

  return (
    <section className="relative w-full pt-24 pb-16 md:pt-32 md:pb-20 flex flex-col justify-end min-h-[60vh] border-b border-zinc-900">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: `url('${bgImage}')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full mt-auto">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-semibold text-sm mb-8 w-fit"
        >
          <ArrowLeft size={16} /> Back to Archive
        </button>

        <div className="flex flex-col gap-12">
          {/* Left: Movie Info */}
          <div className="flex-1 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-1 text-xs font-bold bg-zinc-800 text-zinc-300 rounded border border-zinc-700">Drop Results</span>
              {movie.release_date && (
                <span className="text-sm font-semibold text-zinc-400">
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter leading-none text-white">
              {movie.title}
            </h1>

            {movie.overview && (
              <p className="text-zinc-400 leading-relaxed mb-6 text-sm md:text-base line-clamp-3">
                {movie.overview}
              </p>
            )}

            <MovieMetaDetails
              directorName={movie.director_name}
              watchProviders={movie.watch_providers}
              totalVotes={totalVotes}
            />
          </div>

          {/* The Rating Spectrum (Timeline) */}
          <div className="w-full max-w-4xl mx-auto pt-10">
            <div className="relative">
                {/* The Line Gradient */}
                <div className="h-1 w-full rounded-full bg-gradient-to-r from-red-600 via-zinc-700 to-green-500 relative">

                    {/* Labels */}
                    <div className="absolute -top-8 left-0 text-xs font-bold text-zinc-500 uppercase tracking-widest">Hated It</div>
                    <div className="absolute -top-8 right-0 text-xs font-bold text-zinc-500 uppercase tracking-widest">Loved It</div>

                    {/* Average Marker (Bottom) */}
                    <div className="absolute top-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${officialScore}%` }}>
                        <div className="w-px h-6 bg-amber-400 mb-1"></div>
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-1.5 shadow-xl flex flex-col items-center min-w-[36px]">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Avg</span>
                            <span className="text-lg font-black text-amber-400 leading-none tabular-nums">{Math.round(officialScore)}</span>
                        </div>
                    </div>

                    {/* Your Vote Marker (Top) */}
                    {userScore != null && (
                        <div className="absolute bottom-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${userScore}%` }}>
                            <div className="bg-white rounded-lg p-1.5 shadow-xl flex flex-col items-center mb-1 border-2 border-zinc-300 min-w-[36px]">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">You</span>
                                <span className="text-xl font-black text-zinc-950 leading-none tabular-nums">{userScore}</span>
                            </div>
                            <div className="w-px h-6 bg-white"></div>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
