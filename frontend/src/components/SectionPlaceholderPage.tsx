import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { SiteHeader } from "./SiteHeader";

type HeaderSection = "current-week" | "film-shelf" | "leaderboards" | "discussions";

interface SectionPlaceholderPageProps {
  activeSection: HeaderSection;
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionPlaceholderPage({
  activeSection,
  eyebrow,
  title,
  description,
}: SectionPlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">
      <SiteHeader activeSection={activeSection} />

      <main className="pt-28 md:pt-36 pb-20">
        <section className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="rounded-[2rem] border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.18),_transparent_42%),linear-gradient(180deg,_rgba(39,39,42,0.92)_0%,_rgba(9,9,11,0.96)_100%)] p-8 md:p-12 shadow-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black bg-zinc-800 text-zinc-200 rounded uppercase tracking-widest">
              {eyebrow}
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] text-white">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg text-zinc-400 leading-relaxed">
              {description}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black tracking-wide rounded-xl transition-colors shadow-xl"
              >
                Back to Home
              </button>
              <button
                type="button"
                onClick={() => navigate("/vote")}
                className="w-full sm:w-auto px-7 py-4 bg-zinc-900/60 hover:bg-zinc-800/80 text-white border border-zinc-700/50 font-bold tracking-wide rounded-xl transition-all flex items-center justify-center gap-2"
              >
                See Current Week
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
