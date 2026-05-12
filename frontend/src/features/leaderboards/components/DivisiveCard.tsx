import { Link } from "react-router-dom";

export interface LBDivisive {
  id: number;
  title: string;
  poster_path: string | null;
  drop_id: number | null;
  std_dev: number;
  vote_count: number;
}

export function DivisiveCard({ movie, rank }: { movie: LBDivisive; rank: number }) {
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
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        
        <div className="absolute top-4 left-4">
          <div className="bg-gradient-to-br from-red-500 to-red-700 text-white font-black w-10 h-10 flex items-center justify-center rounded-lg shadow-xl shadow-red-900/50 border border-red-400/20">
            #{rank}
          </div>
        </div>

        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <h3 className="text-2xl font-black leading-tight mb-4 text-white drop-shadow-md group-hover:-translate-y-1 group-hover:text-amber-400 transition-all">{movie.title}</h3>
          
          <div className="grid grid-cols-2 gap-3 group-hover:-translate-y-1 transition-transform delay-75">
            <div className="bg-zinc-950/80 backdrop-blur-md border border-red-500/30 rounded-xl p-3 text-center shadow-lg">
              <div className="text-red-500 font-black text-xl">±{movie.std_dev.toFixed(2)}</div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Std Dev</div>
            </div>
            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-700/50 rounded-xl p-3 text-center shadow-lg">
              <div className="text-white font-black text-xl">{movie.vote_count}</div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Votes</div>
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
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      
      <div className="absolute top-4 left-4">
        <div className="bg-gradient-to-br from-red-500 to-red-700 text-white font-black w-10 h-10 flex items-center justify-center rounded-lg shadow-xl shadow-red-900/50 border border-red-400/20">
          #{rank}
        </div>
      </div>

      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <h3 className="text-2xl font-black leading-tight mb-4 text-white drop-shadow-md group-hover:-translate-y-1 group-hover:text-amber-400 transition-all">{movie.title}</h3>
        
        <div className="grid grid-cols-2 gap-3 group-hover:-translate-y-1 transition-transform delay-75">
          <div className="bg-zinc-950/80 backdrop-blur-md border border-red-500/30 rounded-xl p-3 text-center shadow-lg">
            <div className="text-red-500 font-black text-xl">±{movie.std_dev.toFixed(2)}</div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Std Dev</div>
          </div>
          <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-700/50 rounded-xl p-3 text-center shadow-lg">
            <div className="text-white font-black text-xl">{movie.vote_count}</div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Votes</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
