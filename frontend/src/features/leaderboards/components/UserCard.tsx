import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface LBUser {
  id: number;
  username: string;
  display_name: string | null;
  use_display_name: boolean;
  public_profile: boolean;
  total_votes: number;
}

export function UserCard({ user, rank }: { user: LBUser; rank: number }) {
  const name = user.use_display_name && user.display_name ? user.display_name : user.username;
  
  const content = (
    <div className={`bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 flex items-center gap-4 transition-all duration-300 relative overflow-hidden ${user.public_profile ? 'hover:bg-zinc-800/80 hover:border-zinc-700 group cursor-pointer' : ''}`}>
      {rank <= 3 && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-amber-500/10 transition-colors" />
      )}
      <div className={`w-12 h-12 flex items-center justify-center font-black text-xl rounded-xl z-10 ${rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
        {rank}
      </div>
      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center font-black shrink-0 text-white shadow-inner z-10">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 z-10">
        <h3 className={`font-bold text-white truncate transition-colors ${user.public_profile ? 'group-hover:text-amber-400' : ''}`}>{name}</h3>
        <p className="text-zinc-500 text-xs tracking-wider uppercase mt-0.5">@{user.username}</p>
      </div>
      <div className="text-right z-10 flex items-center gap-4">
        <div>
          <div className="text-2xl font-black text-white">{user.total_votes}</div>
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Votes</div>
        </div>
        {user.public_profile && (
          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors group-hover:translate-x-1" />
        )}
      </div>
    </div>
  );

  return user.public_profile ? <Link to={`/p/${user.username}`} className="block">{content}</Link> : content;
}
