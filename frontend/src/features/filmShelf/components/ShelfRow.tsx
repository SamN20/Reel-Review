import type { LucideIcon } from "lucide-react";
import { Activity, ChevronRight, Flame, Sparkles, Ticket, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useDraggableScroll } from "../../../hooks/useDraggableScroll";
import type { ArchiveShelf, ArchiveShelfKind } from "../api";
import { ShelfMovieCard } from "./ShelfMovieCard";

const SHELF_ICONS: Record<ArchiveShelfKind, LucideIcon> = {
  missed: Activity,
  top_rated: Trophy,
  chronological: Ticket,
  divisive: Flame,
};

interface ShelfRowProps {
  shelf: ArchiveShelf;
  index?: number;
}

export function ShelfRow({ shelf, index = 0 }: ShelfRowProps) {
  const navigate = useNavigate();
  const scrollProps = useDraggableScroll<HTMLDivElement>();
  const Icon = SHELF_ICONS[shelf.kind] ?? Sparkles;

  return (
    <section
      className="film-shelf-content-in relative"
      style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
    >
      <div className="mb-4 flex items-end justify-between gap-4 px-4 md:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="shrink-0 text-red-600" size={22} />
            <h2 className="truncate text-xl font-black tracking-tight text-white md:text-2xl">
              {shelf.title}
            </h2>
          </div>
          {shelf.description ? (
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">{shelf.description}</p>
          ) : null}
        </div>

        {shelf.view_all_path ? (
          <button
            type="button"
            onClick={() => navigate(shelf.view_all_path!)}
            className="hidden shrink-0 items-center gap-1 text-sm font-black text-red-500 transition-colors hover:text-red-400 sm:flex"
          >
            Explore All
            <ChevronRight size={16} />
          </button>
        ) : null}
      </div>

      <div
        {...scrollProps}
        className="hide-scrollbar flex cursor-grab gap-4 overflow-x-auto px-4 pb-7 snap-x snap-mandatory active:cursor-grabbing md:px-8"
      >
        {shelf.items.map((item) => (
          <ShelfMovieCard key={`${shelf.id}-${item.drop_id}`} item={item} shelfKind={shelf.kind} />
        ))}
      </div>
    </section>
  );
}
