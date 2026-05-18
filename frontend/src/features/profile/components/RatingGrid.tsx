import { Link } from "react-router-dom";

import type { ProfileRating } from "../types";

export function RatingGrid({
  ratings,
  emptyMessage,
}: {
  ratings: ProfileRating[];
  emptyMessage: string;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {ratings.length > 0 ? (
        ratings.map((rating, index) => <RatingMovieCard key={index} rating={rating} />)
      ) : (
        <p className="text-zinc-500 col-span-full">{emptyMessage}</p>
      )}
    </div>
  );
}

function RatingMovieCard({ rating }: { rating: ProfileRating }) {
  const posterUrl = rating.movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${rating.movie.poster_path}`
    : "https://via.placeholder.com/342x513.png?text=No+Poster";

  const content = (
    <>
      <img
        src={posterUrl}
        alt={rating.movie.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <h3 className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors">{rating.movie.title}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-amber-400 font-black text-lg">{rating.overall_score}</span>
        </div>
      </div>
    </>
  );

  if (!rating.weekly_drop_id) {
    return (
      <div className="group relative rounded-xl overflow-hidden aspect-[2/3] bg-zinc-900 border border-zinc-800 block">
        {content}
      </div>
    );
  }

  return (
    <Link to={`/results/${rating.weekly_drop_id}`} className="group relative rounded-xl overflow-hidden aspect-[2/3] bg-zinc-900 border border-zinc-800 block">
      {content}
    </Link>
  );
}
