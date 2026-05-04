import { ChevronRight, Play, Ticket, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDraggableScroll } from "../hooks/useDraggableScroll";

interface Movie {
  title: string;
  backdrop_path: string | null;
}

interface PastDrop {
  id: number;
  movie: Movie;
  start_date: string;
  end_date: string;
  community_score: number | null;
  user_has_rated: boolean;
}

export function FilmShelf({ pastDrops }: { pastDrops: PastDrop[] }) {
  const navigate = useNavigate();
  const scrollProps = useDraggableScroll<HTMLDivElement>();

  if (!pastDrops || pastDrops.length === 0) return null;

  return (
    <section className="relative z-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Ticket className="text-red-600" size={24} />
            The Film Shelf
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Catch up on past weeks you missed.
          </p>
        </div>
        <button
          onClick={() => alert("Archive coming soon!")}
          className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
        >
          View Archive
          <ChevronRight size={16} />
        </button>
      </div>

      <div
        {...scrollProps}
        className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {pastDrops.map((drop) => {
          const bgImage = drop.movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${drop.movie.backdrop_path}`
            : "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop";

          return (
            <div
              key={drop.id}
              onClick={() => navigate(`/results/${drop.id}`)}
              className="min-w-[85vw] sm:min-w-[400px] aspect-[21/9] sm:aspect-[16/9] relative rounded-xl overflow-hidden group snap-start cursor-pointer border border-zinc-800/50"
            >
              <div className="absolute inset-0 bg-zinc-900">
                <img
                  src={bgImage}
                  alt={drop.movie.title}
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>

              {/* Revealed Score Badge */}
              {drop.community_score !== null ? (
                <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur border border-zinc-800 text-white font-black text-xl px-3 py-1.5 rounded-lg shadow-xl tabular-nums group-hover:scale-110 transition-transform flex items-center gap-1.5">
                  <Star
                    size={18}
                    className="text-amber-400"
                    fill="currentColor"
                  />
                  {drop.community_score}
                </div>
              ) : (
                <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur border border-zinc-800 text-zinc-400 font-bold text-sm px-3 py-1.5 rounded-lg shadow-xl uppercase tracking-widest">
                  No Votes
                </div>
              )}

              {/* Hover Overlay Button(s) */}
              <div className="absolute inset-0 flex items-center justify-center gap-4 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/results/${drop.id}`);
                  }}
                  className="bg-white text-zinc-950 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl text-sm"
                >
                  <Ticket size={18} /> View Results
                </button>
                
                {!drop.user_has_rated && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/vote/${drop.id}`);
                    }}
                    className="bg-red-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-900/40 text-sm"
                  >
                    <Play size={18} fill="currentColor" /> Rate Now
                  </button>
                )}
              </div>

              <div className="absolute bottom-0 left-0 p-5 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-red-500 text-xs font-bold uppercase tracking-widest">
                    Ended {new Date(drop.end_date).toLocaleDateString()}
                  </div>
                  {!drop.user_has_rated && (
                    <span className="bg-red-950 text-red-400 text-[10px] px-2 py-0.5 rounded border border-red-900/50 font-bold uppercase tracking-wider">
                      Unrated
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-1 group-hover:text-red-400 transition-colors">
                  {drop.movie.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
