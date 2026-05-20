import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clapperboard } from "lucide-react";

import { SiteFooter } from "../../../components/SiteFooter";
import { SiteHeader } from "../../../components/SiteHeader";
import { useAuth } from "../../../context/AuthContext";
import { usePageMeta } from "../../../lib/seo";
import { getPublicRoadmap } from "../api";
import { FeatureSuggestionForm } from "../components/FeatureSuggestionForm";
import { RoadmapTimeline } from "../components/RoadmapTimeline";
import type { RoadmapItem, RoadmapStatus } from "../types";

const STATUSES: RoadmapStatus[] = ["now", "next", "later", "shipped"];

export default function RoadmapPage() {
  const { user, loading, login } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(true);
  const [error, setError] = useState("");

  usePageMeta({
    title: "Roadmap | Reel Review",
    description: "See what is planned, what is in progress, and what has shipped for Reel Review.",
  });

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        const data = await getPublicRoadmap();
        setItems(data);
        setError("");
      } catch (err) {
        console.error("Failed to load roadmap", err);
        setError("The roadmap could not be loaded right now.");
      } finally {
        setIsLoadingRoadmap(false);
      }
    };
    void loadRoadmap();
  }, []);

  const timelineItems = useMemo(() => {
    const statusRank = new Map<RoadmapStatus, number>(STATUSES.map((status, index) => [status, index]));
    return [...items].sort((first, second) => {
      const statusDiff = (statusRank.get(first.status) ?? 0) - (statusRank.get(second.status) ?? 0);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      if (first.sort_order !== second.sort_order) {
        return first.sort_order - second.sort_order;
      }
      return second.id - first.id;
    });
  }, [items]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-600 selection:text-white flex flex-col overflow-x-hidden">
      <SiteHeader activeSection={null} />

      <main className="flex-1">
        <section className="relative -mb-10 min-h-[58vh] overflow-hidden px-4 pt-28 md:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.22),transparent_34rem),radial-gradient(circle_at_top_right,rgba(0,120,178,0.12),transparent_28rem)]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent" />
          <div className="relative z-10 mx-auto flex min-h-[48vh] max-w-7xl flex-col justify-end pb-16">
            <div className="mb-5 flex w-fit items-center gap-2 rounded border border-red-500/30 bg-red-950/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-400">
              <Clapperboard size={13} />
              Roadmap
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.03] tracking-tighter text-white sm:text-7xl">
              What Reel Review is building next.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              Follow the public plan for upcoming community features, shipped improvements, and ideas moving through admin review.
            </p>
          </div>
        </section>

        <div className="relative z-20 mx-auto max-w-7xl px-4 pb-20 md:px-8">
          {error ? (
            <div className="mb-8 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm font-semibold text-red-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
            <section>
              {isLoadingRoadmap ? (
                <div className="space-y-8">
                  {STATUSES.map((status) => (
                    <div key={status} className="h-32 animate-pulse border-l border-zinc-800 bg-zinc-900/20" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="border-l border-zinc-800 py-10 pl-8">
                  <h2 className="text-3xl font-black tracking-tighter text-white">The public roadmap is warming up.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                    Admins have not published roadmap items yet. Member suggestions can still be submitted for review.
                  </p>
                  <ArrowRight className="mt-6 text-red-500" size={24} />
                </div>
              ) : (
                <RoadmapTimeline items={timelineItems} />
              )}
            </section>

            <aside className="lg:sticky lg:top-24">
              {!loading ? (
                <FeatureSuggestionForm signedIn={Boolean(user)} onLogin={login} />
              ) : (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 text-zinc-500">
                  Loading account state...
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
