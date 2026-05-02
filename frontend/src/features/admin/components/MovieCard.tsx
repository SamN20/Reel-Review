import React from "react";

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string;
    in_pool?: boolean;
  };
  onDelete?: (id: number, title: string) => void;
  onTogglePool?: (id: number, inPool: boolean) => void;
  draggable?: boolean;
  compact?: boolean;
}

export function MovieCard({
  movie,
  onDelete,
  draggable = true,
  compact = false,
}: MovieCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(movie));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      className={`bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 group transition-all hover:border-zinc-600 ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${compact ? "flex items-center gap-3 p-2" : ""}`}
    >
      {compact ? (
        <>
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
              alt={movie.title}
              className="w-10 h-14 object-cover rounded flex-shrink-0"
              draggable={false}
            />
          ) : (
            <div className="w-10 h-14 bg-zinc-800 rounded flex items-center justify-center text-[8px] text-zinc-500 flex-shrink-0">
              N/A
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {movie.title}
            </p>
            <p className="text-xs text-zinc-500">
              {movie.release_date?.substring(0, 4)}
            </p>
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(movie.id, movie.title);
              }}
              className="text-zinc-600 hover:text-red-500 text-xs p-1 flex-shrink-0 transition-colors"
              title="Delete movie"
            >
              ✕
            </button>
          )}
        </>
      ) : (
        <>
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              alt={movie.title}
              className="w-full aspect-[2/3] object-cover group-hover:opacity-80 transition-opacity"
              draggable={false}
            />
          ) : (
            <div className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center p-4 text-center text-zinc-500 text-sm">
              No Poster
            </div>
          )}
          <div className="p-3">
            <h3 className="font-semibold text-white text-sm line-clamp-1">
              {movie.title}
            </h3>
            <p className="text-xs text-zinc-400">
              {movie.release_date?.substring(0, 4)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
