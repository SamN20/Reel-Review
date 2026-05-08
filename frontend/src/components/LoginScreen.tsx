import { useMemo } from "react";

interface LoginScreenProps {
  pastDrops: any[];
  onLogin: () => void;
}

export function LoginScreen({ pastDrops, onLogin }: LoginScreenProps) {
  // Safely extract and seamlessly duplicate posters so the grid is always densely populated
  const { posters, gridCols } = useMemo(() => {
    const valid = pastDrops
      .filter((drop) => drop.movie?.poster_path)
      .map((drop) => drop.movie.poster_path);
    
    if (valid.length === 0) return { posters: [], gridCols: "" };

    // Determine scale dynamically based on how many unique posters we have
    let targetCount = 40; // The sweet spot
    let cols = "grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8";

    if (valid.length < 8) {
      // Very few movies: zoom in, show fewer total posters, fewer columns = larger posters
      targetCount = 20;
      cols = "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5";
    } else if (valid.length >= 25) {
      // Lots of movies: we can safely show a highly dense wall without obvious repeats
      targetCount = 80;
      cols = "grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10";
    }

    // Fill to the target count
    let filled = [...valid];
    while (filled.length < targetCount) {
      filled = [...filled, ...valid];
    }
    filled = filled.slice(0, targetCount);

    // Perform a final rigorous shuffle on the entirety of the filled array.
    // This breaks up any contiguous patterns (like A,B,C, A,B,C) making repeats nearly invisible.
    for (let i = filled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filled[i], filled[j]] = [filled[j], filled[i]];
    }

    return { posters: filled, gridCols: cols };
  }, [pastDrops]);

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden">
      <style>{`
        @keyframes cinematic-pan {
          0% { transform: translate3d(0, 0, 0) rotate(-6deg) scale(1.25); }
          100% { transform: translate3d(-3%, -6%, 0) rotate(-6deg) scale(1.25); }
        }
        .cinematic-grid-container {
          animation: cinematic-pan 45s ease-in-out infinite alternate;
          width: 150vw;
          height: 150vh;
          left: -25vw;
          top: -25vh;
        }
      `}</style>
      
      {/* Cinematic Collage Texture */}
      {posters.length > 0 && (
        <div className="absolute z-0 pointer-events-none opacity-20 cinematic-grid-container">
          <div className={`grid ${gridCols} gap-3 sm:gap-4 lg:gap-5 w-full h-full content-center`}>
            {posters.map((path, idx) => (
              <div
                key={`${path}-${idx}`}
                className="w-full aspect-[2/3] bg-cover bg-center rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w342${path})` }}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Immersive gradient to blend edges and keep center text legible */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/40 z-0 pointer-events-none"></div>

      {/* Main UI */}
      <div className="relative z-10 text-center flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-white uppercase drop-shadow-[0_0_20px_rgba(0,0,0,1)]">
          Reel Review
        </h1>
        <p className="mb-10 text-zinc-300 text-sm md:text-base uppercase tracking-widest font-bold drop-shadow-[0_0_10px_rgba(0,0,0,1)]">
          Join for Weekly Movies
        </p>
        <button
          onClick={onLogin}
          className="px-8 py-4 bg-red-600 text-white font-bold rounded-sm uppercase tracking-wide hover:bg-red-500 transition-all shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] active:scale-95"
        >
          Login with KeyN
        </button>
      </div>
    </div>
  );
}
