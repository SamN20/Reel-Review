import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { SiteFooter } from "../../../components/SiteFooter";
import { SiteHeader } from "../../../components/SiteHeader";
import { formatDateUTC } from "../../../lib/dateUtils";
import { useAuth } from "../../../context/AuthContext";
import { fetchArchiveVoteOrder, type ArchiveMovieItem } from "../api";
import { getBackdropUrl, getReleaseYear } from "../image";

export default function VoteOrderPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ArchiveMovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let isMounted = true;
    async function loadItems() {
      try {
        const response = await fetchArchiveVoteOrder(Boolean(user));
        if (isMounted) {
          setItems(response.items);
        }
      } catch (err) {
        console.error("Failed to load vote order", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadItems();
    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-50">
      <SiteHeader activeSection="film-shelf" />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 md:px-8">
        <button
          type="button"
          onClick={() => navigate("/film-shelf")}
          className="mb-8 flex items-center gap-2 text-sm font-bold text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Film Shelf
        </button>

        <div className="mb-8 flex flex-col gap-3 border-b border-zinc-900 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-300">
              <Ticket size={13} className="text-red-600" />
              Vote Order
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Complete Archive
            </h1>
          </div>
          <p className="text-sm font-bold text-zinc-500">{items.length} previous drops</p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-zinc-400">Loading archive...</div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <button
                key={item.drop_id}
                type="button"
                onClick={() => navigate(item.user_has_rated ? `/results/${item.drop_id}` : `/vote/${item.drop_id}`)}
                className="grid grid-cols-[96px_minmax(0,1fr)] items-stretch overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-900 sm:grid-cols-[150px_minmax(0,1fr)_auto]"
              >
                <img
                  src={getBackdropUrl(item.movie.backdrop_path)}
                  alt={item.movie.title}
                  className="h-full min-h-24 w-full object-cover opacity-70"
                />
                <div className="min-w-0 p-4">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Ended {formatDateUTC(item.end_date)}</span>
                    <span>{getReleaseYear(item.movie.release_date)}</span>
                    {item.user_has_rated ? (
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <CheckCircle2 size={11} />
                        Rated
                      </span>
                    ) : null}
                  </div>
                  <h2 className="truncate text-lg font-black text-white sm:text-xl">{item.movie.title}</h2>
                  <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
                    {item.movie.overview || "No overview available."}
                  </p>
                </div>
                <div className="hidden items-center gap-6 px-5 sm:flex">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Avg</p>
                    <p className="text-xl font-black text-white tabular-nums">{item.community_score ?? "--"}</p>
                  </div>
                  {item.user_score !== null ? (
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">You</p>
                      <p className="text-xl font-black text-green-400 tabular-nums">{item.user_score}</p>
                    </div>
                  ) : null}
                  <ChevronRight className="text-zinc-600" size={20} />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
