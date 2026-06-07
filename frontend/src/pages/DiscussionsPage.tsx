import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays, Film, MessageSquare, ShieldAlert } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { NotificationBanner } from "../components/NotificationBanner";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { CommunityTakes } from "../features/results/components/CommunityTakes";
import { fetchResultsSummary, type ResultsSummary, type ReviewTab } from "../features/results/api";
import { WatchPartyBoard } from "../features/watchParties/components/WatchPartyBoard";
import { getBackdropUrl, getReleaseYear } from "../features/filmShelf/image";
import { apiGet } from "../lib/api";
import { usePageMeta } from "../lib/seo";

interface DiscussionDrop {
  id: number;
  movie: {
    title: string;
    overview: string | null;
    backdrop_path: string | null;
    poster_path?: string | null;
    release_date?: string | null;
  };
  start_date: string;
  end_date: string;
  community_score?: number | null;
  user_has_rated?: boolean;
}

const VALID_TABS = new Set<ReviewTab>(["spoiler-free", "spoilers"]);

function getInitialTab(value: string | null): ReviewTab {
  return value && VALID_TABS.has(value as ReviewTab) ? (value as ReviewTab) : "spoiler-free";
}

function formatDropWindow(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  return `${formatter.format(new Date(`${startDate}T00:00:00`))} - ${formatter.format(new Date(`${endDate}T00:00:00`))}`;
}

function todayDateKey() {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function hasVotingEnded(endDate: string) {
  return endDate < todayDateKey();
}

export default function DiscussionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = useMemo(() => getInitialTab(searchParams.get("tab")), [searchParams]);
  const [currentDrop, setCurrentDrop] = useState<DiscussionDrop | null>(null);
  const [pastDrops, setPastDrops] = useState<DiscussionDrop[]>([]);
  const [selectedDropId, setSelectedDropId] = useState<number | null>(null);
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [loadingDrops, setLoadingDrops] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");

  const selectedDrop = useMemo(() => {
    if (currentDrop?.id === selectedDropId) return currentDrop;
    return pastDrops.find((drop) => drop.id === selectedDropId) ?? null;
  }, [currentDrop, pastDrops, selectedDropId]);

  const movieTitle = summary?.movie.title ?? selectedDrop?.movie.title;
  const releaseYear = getReleaseYear(summary?.movie.release_date ?? selectedDrop?.movie.release_date ?? null);
  const heroImage = getBackdropUrl(summary?.movie.backdrop_path ?? selectedDrop?.movie.backdrop_path ?? null, "original");
  const recentDrops = pastDrops.slice(0, 6);
  const hideCommunityScores = selectedDrop ? !hasVotingEnded(selectedDrop.end_date) : false;

  usePageMeta({
    title: movieTitle ? `Community: ${movieTitle} | Reel Review` : "Community | Reel Review",
    description: movieTitle
      ? `Find watch parties and spoiler-safe Reel Review conversations for ${movieTitle}.`
      : "Find Reel Review watch parties, spoiler-free takes, and spoiler-zone conversations.",
  });

  useEffect(() => {
    const loadDrops = async () => {
      setLoadingDrops(true);
      setError("");

      const requestedDropId = Number(searchParams.get("drop"));

      try {
        const [currentResult, pastResult] = await Promise.allSettled([
          apiGet<DiscussionDrop>("/api/v1/drops/current"),
          apiGet<DiscussionDrop[]>("/api/v1/drops/past", true),
        ]);

        const nextCurrent = currentResult.status === "fulfilled" ? currentResult.value : null;
        const nextPast = pastResult.status === "fulfilled" ? pastResult.value : [];
        const fallbackDrop = nextCurrent ?? nextPast[0] ?? null;
        const requestedDrop =
          Number.isFinite(requestedDropId) && requestedDropId > 0
            ? [nextCurrent, ...nextPast].find((drop) => drop?.id === requestedDropId) ?? null
            : null;

        setCurrentDrop(nextCurrent);
        setPastDrops(nextPast);
        setSelectedDropId((requestedDrop ?? fallbackDrop)?.id ?? null);
      } catch (err) {
        console.error("Failed to load discussion drops", err);
        setError("Community could not be loaded right now.");
      } finally {
        setLoadingDrops(false);
      }
    };

    void loadDrops();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedDropId) {
      return;
    }

    const loadSummary = async () => {
      setLoadingSummary(true);
      setError("");

      try {
        const response = await fetchResultsSummary(String(selectedDropId));
        setSummary(response);
      } catch (err) {
        console.error("Failed to load discussion summary", err);
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("That discussion could not be found.");
        } else {
          setError("Community takes could not be loaded right now.");
        }
      } finally {
        setLoadingSummary(false);
      }
    };

    void loadSummary();
  }, [selectedDropId]);

  const selectDrop = (dropId: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("drop", String(dropId));
    setSearchParams(nextParams);
    setSelectedDropId(dropId);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-600 selection:text-white flex flex-col overflow-x-hidden">
      <SiteHeader activeSection="community" />
      <NotificationBanner />

      <main className="flex-1">
        <section className="relative min-h-[58vh] overflow-hidden px-4 pt-28 md:px-8">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-45"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" />

          <div className="relative z-10 mx-auto flex min-h-[48vh] max-w-7xl flex-col justify-end pb-14">
            <div className="mb-5 flex w-fit items-center gap-2 rounded border border-red-500/30 bg-red-950/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-400">
              <MessageSquare size={13} />
              Community
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.03] tracking-tighter text-white sm:text-7xl">
              {movieTitle ? movieTitle : "Community takes are warming up."}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-400">
              {selectedDrop ? (
                <>
                  <span>{releaseYear}</span>
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                  <span>{formatDropWindow(selectedDrop.start_date, selectedDrop.end_date)}</span>
                  {currentDrop?.id === selectedDrop.id ? (
                    <>
                      <span className="h-1 w-1 rounded-full bg-zinc-600" />
                      <span className="text-red-400">Current Drop</span>
                    </>
                  ) : null}
                </>
              ) : (
                <span>No active discussion selected</span>
              )}
            </div>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              Host a watch party, meet up for this week&apos;s film, keep first impressions spoiler-free, and step into the spoiler zone only when you are ready.
            </p>
          </div>
        </section>

        <section className="relative z-20 mx-auto grid max-w-7xl gap-10 px-4 pb-20 md:px-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-300">
              <CalendarDays size={18} className="text-zinc-500" />
              Recent Drops
            </div>

            <div className="space-y-2">
              {currentDrop ? (
                <button
                  type="button"
                  onClick={() => selectDrop(currentDrop.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedDropId === currentDrop.id
                      ? "border-red-500/60 bg-red-950/20 text-white"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Current Week</p>
                  <p className="mt-1 line-clamp-2 text-sm font-bold">{currentDrop.movie.title}</p>
                </button>
              ) : null}

              {recentDrops.map((drop) => (
                <button
                  type="button"
                  key={drop.id}
                  onClick={() => selectDrop(drop.id)}
                  className={`group flex w-full gap-3 rounded-lg border p-2 text-left transition-colors ${
                    selectedDropId === drop.id
                      ? "border-zinc-600 bg-zinc-900 text-white"
                      : "border-zinc-800 bg-zinc-900/25 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-white"
                  }`}
                >
                  <div
                    className="h-14 w-20 shrink-0 rounded bg-cover bg-center"
                    style={{ backgroundImage: `url(${getBackdropUrl(drop.movie.backdrop_path ?? null)})` }}
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-bold">{drop.movie.title}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {drop.community_score ? `${Math.round(drop.community_score)}/100` : "Open thread"}
                    </p>
                  </div>
                </button>
              ))}

              {!loadingDrops && !currentDrop && recentDrops.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 p-5 text-sm text-zinc-500">
                  No discussion drops are available yet.
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0">
            {error ? (
              <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm font-semibold text-red-200">
                {error}
              </div>
            ) : null}

            {loadingDrops || loadingSummary ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-10 text-center text-zinc-500">
                Loading community takes...
              </div>
            ) : summary ? (
              <>
                <div className="mb-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/35 p-5">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                      <Film size={15} />
                      Thread Guide
                    </div>
                    <p className="text-sm leading-6 text-zinc-300">
                      Spoiler-free is for tone, performances, and first impressions. Save plot turns and ending talk for the gated tab.
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-900/40 bg-red-950/10 p-5">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
                      <ShieldAlert size={15} />
                      Spoiler Safety
                    </div>
                    <p className="text-sm leading-6 text-zinc-300">
                      Reports still go to the existing moderation queue, and admins can move misplaced spoilers into the spoiler section.
                    </p>
                  </div>
                </div>

                <div className="mb-10">
                  <WatchPartyBoard />
                </div>

                <CommunityTakes
                  key={`${summary.drop_id}-${initialTab}`}
                  dropId={summary.drop_id}
                  initialReviews={summary.reviews}
                  officialScore={summary.official_score}
                  userScore={summary.user_score}
                  initialTab={initialTab}
                  hideScores={hideCommunityScores}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-10 text-center">
                <h2 className="text-2xl font-black tracking-tight text-white">No discussion selected.</h2>
                <p className="mt-3 text-sm text-zinc-500">Once a weekly drop is available, community takes will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
