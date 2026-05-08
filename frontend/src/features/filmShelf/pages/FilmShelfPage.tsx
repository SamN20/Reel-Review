import { useEffect, useState } from "react";
import { RefreshCcw, Ticket } from "lucide-react";

import { SiteFooter } from "../../../components/SiteFooter";
import { SiteHeader } from "../../../components/SiteHeader";
import { useAuth } from "../../../context/AuthContext";
import { fetchArchiveShelves, type ArchiveShelf } from "../api";
import { FilmShelfDiscoverHero } from "../components/FilmShelfDiscoverHero";
import { ShelfRow } from "../components/ShelfRow";
import { FilmShelfSkeleton } from "../components/ShelfSkeleton";

export default function FilmShelfPage() {
  const { user, loading: authLoading } = useAuth();
  const [shelves, setShelves] = useState<ArchiveShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let isMounted = true;
    async function loadShelves() {
      try {
        setLoading(true);
        setShowSkeletons(false);
        setError(null);
        const response = await fetchArchiveShelves(Boolean(user));
        if (isMounted) {
          setShelves(response.shelves);
        }
      } catch (err) {
        console.error("Failed to load Film Shelf", err);
        if (isMounted) {
          setError("The Film Shelf could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadShelves();
    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  const isLoadingShelves = authLoading || loading;
  const shouldShowSkeletons = isLoadingShelves && showSkeletons;
  const hasShelves = !isLoadingShelves && !error && shelves.length > 0;

  useEffect(() => {
    if (!isLoadingShelves) {
      return;
    }

    const skeletonDelay = setTimeout(() => {
      setShowSkeletons(true);
    }, 220);

    return () => clearTimeout(skeletonDelay);
  }, [isLoadingShelves]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-50 selection:bg-red-600 selection:text-white">
      <SiteHeader activeSection="film-shelf" />

      <main className={`pb-16 ${hasShelves ? "" : "pt-24 md:pt-28"}`}>
        {!hasShelves ? (
          <section className="relative px-4 pb-8 md:px-8 md:pb-10">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col gap-5 border-b border-zinc-900 pb-8 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <h1 className="text-4xl font-black leading-none tracking-tight text-white md:text-6xl">
                    The Film Shelf
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
                    Browse past drops, catch up on movies you missed, and revisit how the community scored each week.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {shouldShowSkeletons ? (
          <FilmShelfSkeleton />
        ) : isLoadingShelves ? (
          <div className="min-h-[42vh]" aria-hidden="true" />
        ) : error ? (
          <section className="mx-auto max-w-3xl px-4 md:px-8">
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-6 text-center">
              <RefreshCcw className="mx-auto mb-3 text-red-500" size={28} />
              <h2 className="text-xl font-black text-white">{error}</h2>
              <p className="mt-2 text-sm text-zinc-400">Refresh the page to try again.</p>
            </div>
          </section>
        ) : hasShelves ? (
          <div className="space-y-10">
            <FilmShelfDiscoverHero shelves={shelves} />
            {shelves.map((shelf, index) => (
              <ShelfRow key={shelf.id} shelf={shelf} index={index} />
            ))}
          </div>
        ) : (
          <section className="mx-auto max-w-3xl px-4 md:px-8">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <Ticket className="mx-auto mb-4 text-red-600" size={32} />
              <h2 className="text-2xl font-black text-white">No past drops yet.</h2>
              <p className="mt-2 text-zinc-400">Once the first weekly drop closes, it will land here.</p>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
