import React, { useState } from 'react';
import { MovieCard } from './MovieCard';

interface KanbanColumnProps {
  title: string;
  subtitle: string;
  accentColor: string;
  movies: any[];
  onDrop: (movie: any) => void;
  onDeleteMovie?: (id: number, title: string) => void;
  emptyMessage: string;
  compact?: boolean;
}

const ACCENT_STYLES: Record<string, { border: string; bg: string }> = {
  zinc: { border: '#71717a', bg: 'rgba(113,113,122,0.05)' },
  amber: { border: '#f59e0b', bg: 'rgba(245,158,11,0.05)' },
  red: { border: '#ef4444', bg: 'rgba(239,68,68,0.05)' },
};

export function KanbanColumn({
  title,
  subtitle,
  accentColor,
  movies,
  onDrop,
  onDeleteMovie,
  emptyMessage,
  compact = false,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const accent = ACCENT_STYLES[accentColor] || ACCENT_STYLES.zinc;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop(data);
    } catch {
      console.error('Invalid drop data');
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col rounded-xl border transition-all duration-300 min-h-[400px]"
      style={
        isDragOver
          ? { borderColor: accent.border, backgroundColor: accent.bg, boxShadow: `0 0 20px ${accent.bg}` }
          : { borderColor: '#27272a', backgroundColor: 'rgba(24,24,27,0.5)' }
      }
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
          <span className="ml-auto bg-zinc-800 text-zinc-400 text-xs font-bold px-2 py-0.5 rounded-full">{movies.length}</span>
        </div>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-y-auto max-h-[60vh] space-y-2">
        {movies.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-lg p-8 flex items-center justify-center text-sm text-center transition-all duration-300"
            style={
              isDragOver
                ? { borderColor: accent.border, color: '#a1a1aa', backgroundColor: accent.bg }
                : { borderColor: '#3f3f46', color: '#52525b' }
            }
          >
            {isDragOver ? 'Drop here' : emptyMessage}
          </div>
        ) : compact ? (
          movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onDelete={onDeleteMovie} compact />
          ))
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onDelete={onDeleteMovie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
