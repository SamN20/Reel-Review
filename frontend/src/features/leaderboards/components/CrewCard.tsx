import { Link } from "react-router-dom";
import { Users, Clapperboard, Star } from "lucide-react";

export interface LBCrew {
  name: string;
  profile_path?: string | null;
  average_score: number;
  movie_count: number;
}

export function CrewCard({ crew, rank, isDirector = false }: { crew: LBCrew; rank: number; isDirector?: boolean }) {
  const profileUrl = crew.profile_path 
    ? `https://image.tmdb.org/t/p/w185${crew.profile_path}`
    : null;
    
  const linkPath = isDirector ? `/director/${encodeURIComponent(crew.name)}` : `/actor/${encodeURIComponent(crew.name)}`;

  return (
    <Link to={linkPath} className="block">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 hover:bg-zinc-800/80 transition-colors relative overflow-hidden group">
          {rank <= 3 && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-amber-500/10 transition-colors" />
          )}
          <div className={`w-12 h-12 flex items-center justify-center font-black text-xl rounded-xl z-10 ${rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
            {rank}
          </div>
          
          <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 shrink-0 shadow-lg z-10 border border-zinc-700/50 flex items-center justify-center">
            {profileUrl ? (
              <img src={profileUrl} alt={crew.name} className="w-full h-full object-cover" />
            ) : (
              isDirector ? <Clapperboard className="w-6 h-6 text-zinc-600" /> : <Users className="w-6 h-6 text-zinc-600" />
            )}
          </div>
    
          <div className="flex-1 min-w-0 z-10">
            <h3 className="font-bold text-white truncate text-lg group-hover:text-amber-400 transition-colors">{crew.name}</h3>
            <p className="text-zinc-500 text-xs tracking-wider uppercase mt-0.5">{crew.movie_count} movies rated</p>
          </div>
          <div className="text-right z-10">
            <div className="text-2xl font-black text-amber-400 flex items-center justify-end gap-1">
              {crew.average_score.toFixed(1)} <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Avg Score</div>
          </div>
        </div>
    </Link>
  );
}
