import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { ArchiveMovieItem, ArchiveShelf } from "../api";
import { getBackdropUrl, getReleaseYear } from "../image";

interface FilmShelfDiscoverHeroProps {
  shelves: ArchiveShelf[];
}

function getDiscoverItems(shelves: ArchiveShelf[]) {
  const itemsByDrop = new Map<number, ArchiveMovieItem>();
  shelves.forEach((shelf) => {
    shelf.items.forEach((item) => {
      if (!itemsByDrop.has(item.drop_id) && item.movie.backdrop_path) {
        itemsByDrop.set(item.drop_id, item);
      }
    });
  });
  return Array.from(itemsByDrop.values()).slice(0, 8);
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function FilmShelfDiscoverHero({ shelves }: FilmShelfDiscoverHeroProps) {
  const navigate = useNavigate();
  const items = useMemo(() => getDiscoverItems(shelves), [shelves]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);

  const activeItem = items[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
    setShowTrailer(false);
  }, [items]);

  useEffect(() => {
    setShowTrailer(false);
    if (!activeItem?.movie.trailer_youtube_key || prefersReducedMotion()) {
      return;
    }

    const trailerDelay = window.setTimeout(() => {
      setShowTrailer(true);
    }, 3600);

    return () => window.clearTimeout(trailerDelay);
  }, [activeItem]);

  useEffect(() => {
    if (items.length <= 1) return;
    const advanceDelay = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
    }, showTrailer ? 14000 : 8500);
    return () => window.clearInterval(advanceDelay);
  }, [items.length, showTrailer]);

  if (!activeItem) {
    return null;
  }

  const trailerKey = activeItem.movie.trailer_youtube_key;
  const resultPath = `/results/${activeItem.drop_id}`;
  const votePath = `/vote/${activeItem.drop_id}`;
  const primaryPath = activeItem.user_has_rated ? resultPath : votePath;

  const moveSlide = (direction: 1 | -1) => {
    setActiveIndex((index) => (index + direction + items.length) % items.length);
  };

  return (
    <section className="relative mb-10 min-h-[78vh] overflow-hidden bg-zinc-950">
      {items.map((item) => {
        const isActive = item.drop_id === activeItem.drop_id;
        return (
          <img
            key={item.drop_id}
            src={getBackdropUrl(item.movie.backdrop_path, "original")}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform,filter] duration-1000 ease-out ${
              isActive && !showTrailer
                ? "scale-100 opacity-75 blur-0"
                : "scale-105 opacity-0 blur-sm"
            }`}
          />
        );
      })}

      {showTrailer && trailerKey ? (
        <iframe
          key={trailerKey}
          title={`${activeItem.movie.title} trailer`}
          src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&loop=1&playlist=${trailerKey}&modestbranding=1&playsinline=1&rel=0`}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="film-shelf-trailer-frame pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-0 opacity-65"
          tabIndex={-1}
        />
      ) : null}

      {showTrailer && trailerKey ? (
        <div
          key={`${activeItem.drop_id}-trailer-curtain`}
          className="film-shelf-trailer-curtain absolute inset-0"
          style={{
            backgroundImage: `url(${getBackdropUrl(activeItem.movie.backdrop_path, "original")})`,
          }}
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/65 to-zinc-950/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-zinc-950/95 to-transparent" />

      {items.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => moveSlide(-1)}
            className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-950/40 text-white backdrop-blur transition-colors hover:bg-zinc-900/80 md:flex"
            aria-label="Previous featured movie"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={() => moveSlide(1)}
            className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-950/40 text-white backdrop-blur transition-colors hover:bg-zinc-900/80 md:flex"
            aria-label="Next featured movie"
          >
            <ChevronRight size={24} />
          </button>
        </>
      ) : null}

      <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-7xl items-end px-4 pb-20 pt-28 md:px-8">
        <div key={activeItem.drop_id} className="film-shelf-content-in max-w-3xl">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-red-500">
              The Film Shelf
            </p>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-zinc-300 md:text-base">
              Browse past drops, catch up on movies you missed, and revisit how the community scored each week.
            </p>
          </div>
          <h1 className="text-4xl font-black leading-none tracking-tight text-white drop-shadow-2xl md:text-7xl">
            {activeItem.movie.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold text-zinc-200">
            <span>{getReleaseYear(activeItem.movie.release_date)}</span>
            {activeItem.movie.genres[0] ? <span>{activeItem.movie.genres[0].name}</span> : null}
            <span className="inline-flex items-center gap-1.5 rounded bg-zinc-950/75 px-2.5 py-1 text-amber-300">
              <Star size={14} fill="currentColor" /> {activeItem.community_score ?? "--"}
            </span>
            {activeItem.user_has_rated && activeItem.user_score !== null ? (
              <span className="inline-flex items-center gap-1.5 rounded bg-zinc-950/75 px-2.5 py-1 text-green-400">
                <CheckCircle2 size={14} /> You {activeItem.user_score}
              </span>
            ) : null}
          </div>
          {activeItem.movie.overview ? (
            <p className="mt-5 line-clamp-3 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              {activeItem.movie.overview}
            </p>
          ) : null}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(primaryPath)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-red-950/40 transition-colors hover:bg-red-500"
            >
              <Play size={17} fill="currentColor" />
              {activeItem.user_has_rated ? "View Results" : "Rate Now"}
            </button>
            <button
              type="button"
              onClick={() => navigate(resultPath)}
              className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur transition-colors hover:bg-white/15"
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {items.length > 1 ? (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {items.map((item, index) => (
            <button
              key={item.drop_id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Show ${item.movie.title}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
