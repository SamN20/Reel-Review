import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export interface LBCategoryMovie {
  id: number;
  title: string;
  poster_path: string | null;
  drop_id: number | null;
  score: number;
}

export function CategoryMovieCard({ movie, rank, categoryName }: { movie: LBCategoryMovie; rank: number; categoryName: string }) {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` 
    : "https://via.placeholder.com/342x513.png?text=No+Poster";

  if (!movie.drop_id) {
    return (
      <div className="group relative rounded-xl overflow-hidden aspect-[2/3] bg-zinc-900 border border-zinc-800 shadow-xl block">
        <img 
          src={posterUrl} 
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="absolute top-4 left-4">
          <div className={`font-black w-10 h-10 flex items-center justify-center rounded-lg shadow-xl ${rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-amber-500/20' : 'bg-zinc-800/80 text-white backdrop-blur-sm'}`}>
            #{rank}
          </div>
        </div>

        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <h3 className="text-lg font-black leading-tight mb-2 text-white drop-shadow-md group-hover:-translate-y-1 transition-transform">{movie.title}</h3>
          
          <div className="flex items-center justify-between group-hover:-translate-y-1 transition-transform delay-75">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{categoryName}</span>
            <div className="text-amber-400 font-black text-xl flex items-center gap-1">
              {movie.score.toFixed(1)} <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/results/${movie.drop_id}`} className="group relative rounded-xl overflow-hidden aspect-[2/3] bg-zinc-900 border border-zinc-800 shadow-xl block">
      <img 
        src={posterUrl} 
        alt={movie.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      
      <div className="absolute top-4 left-4">
        <div className={`font-black w-10 h-10 flex items-center justify-center rounded-lg shadow-xl ${rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-amber-500/20' : 'bg-zinc-800/80 text-white backdrop-blur-sm'}`}>
          #{rank}
        </div>
      </div>

      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <h3 className="text-lg font-black leading-tight mb-2 text-white drop-shadow-md group-hover:-translate-y-1 transition-transform">{movie.title}</h3>
        
        <div className="flex items-center justify-between group-hover:-translate-y-1 transition-transform delay-75">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{categoryName}</span>
          <div className="text-amber-400 font-black text-xl flex items-center gap-1">
            {movie.score.toFixed(1)} <Star className="w-4 h-4 fill-amber-400" />
          </div>
        </div>
      </div>
    </Link>
  );
}
