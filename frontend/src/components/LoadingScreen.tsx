import { Film } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Curating community drops..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Background radial cinematic spotlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[4000ms]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-zinc-900/40 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Loader Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Animated glowing container */}
        <div className="relative flex items-center justify-center w-20 h-20">
          {/* External pulsating halo */}
          <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping duration-[1500ms]"></div>
          {/* Inner glass elevated shell */}
          <div className="absolute inset-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center shadow-2xl shadow-red-950/20">
            <Film size={28} className="text-red-500 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
        </div>

        {/* Text Area */}
        <div className="text-center space-y-2 max-w-sm px-4">
          <h2 className="text-xl font-black tracking-[0.25em] text-white uppercase drop-shadow-md select-none">
            Reel Review
          </h2>
          <div className="flex justify-center items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce duration-1000"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce duration-1000 delay-150"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce duration-1000 delay-300"></span>
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest pt-1">
            {message}
          </p>
        </div>
      </div>

      {/* Premium Footer Accent */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
          byNolo Programming Org
        </span>
      </div>
    </div>
  );
}
