import { Users, Film, Star, CalendarDays } from "lucide-react";

export function StatCard({ title, value }: { title: string; value: number }) {
  const getIcon = () => {
    switch (title) {
      case "Total Users": return <Users className="w-5 h-5 text-zinc-500" />;
      case "Total Movies": return <Film className="w-5 h-5 text-zinc-500" />;
      case "Total Ratings": return <Star className="w-5 h-5 text-zinc-500" />;
      case "Weekly Drops": return <CalendarDays className="w-5 h-5 text-zinc-500" />;
      default: return null;
    }
  };

  return (
    <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
        {getIcon()}
      </div>
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">
        {title}
      </p>
      <p className="text-3xl font-black text-zinc-100 tracking-tighter relative z-10">{value}</p>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-900/50 to-transparent"></div>
    </div>
  );
}
