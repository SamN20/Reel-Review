import { ArrowLeft, Database, Link2, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export default function Attribution() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-red-600 selection:text-white">
      <SiteHeader />

      {/* Title Hero Banner */}
      <div className="relative pt-28 pb-12 overflow-hidden border-b border-zinc-900 bg-gradient-to-b from-zinc-900/20 via-zinc-950 to-zinc-950">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(0,120,178,0.06),_transparent_45%)]"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest mb-6"
          >
            <ArrowLeft size={14} /> Go Back
          </button>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-950/25 border border-blue-900/40 px-3 py-1 rounded">
            Partners & Data Providers
          </span>
          <h1 className="text-4xl md:text-5xl font-black mt-4 tracking-tighter text-white">
            Data Attributions
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl mt-4 leading-relaxed">
            Reel Review is built on top of high-fidelity, world-class APIs. We express our deep appreciation 
            and fulfill mandatory legal integrations for our incredible metadata partners.
          </p>
        </div>
      </div>

      {/* Page Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* TMDB Column */}
          <div className="group relative bg-zinc-900/25 border border-zinc-900 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-800 hover:bg-zinc-900/40 transition-all duration-300 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/30 border border-emerald-900/50 px-3 py-1 rounded-full">
                  Movie Metadata Partner
                </span>
                <Database size={18} className="text-zinc-600" />
              </div>
              
              {/* TMDB Logo Area */}
              <div className="h-16 flex items-center mb-8">
                <img 
                  src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_long_1-8ba2ac31f354005783fab473602c34c3f4fd207150182061e425d366e4f34596.svg" 
                  alt="The Movie Database (TMDB) Logo" 
                  className="h-6 object-contain filter brightness-105"
                />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white mb-4">
                The Movie Database (TMDB)
              </h2>
              
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Reel Review utilizes TMDB's rich catalog API to ingest beautiful backdrop artwork, posters, release dates, storylines, and director credits. TMDB's community-maintained catalog is the engine behind our synchronized weekly movie drops.
              </p>
            </div>

            <div className="space-y-6 pt-6 border-t border-zinc-900/80">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 text-xs text-zinc-500 leading-relaxed italic">
                "This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB."
              </div>
              
              <a 
                href="https://www.themoviedb.org" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest"
              >
                Explore TMDB <Link2 size={12} />
              </a>
            </div>
          </div>

          {/* JustWatch Column */}
          <div className="group relative bg-zinc-900/25 border border-zinc-900 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-800 hover:bg-zinc-900/40 transition-all duration-300 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-colors duration-500"></div>
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-950/30 border border-amber-900/50 px-3 py-1 rounded-full">
                  Streaming Directory Partner
                </span>
                <Database size={18} className="text-zinc-600" />
              </div>
              
              {/* JustWatch Logo Area */}
              <div className="h-16 flex items-center mb-8">
                <img 
                  src="https://www.justwatch.com/appassets/img/logo/JustWatch-logo-large.webp" 
                  alt="JustWatch Logo" 
                  className="h-6 object-contain"
                />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white mb-4">
                JustWatch Directory
              </h2>
              
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                All watch providers and streaming details shown on our weekly drop dashboards are sourced and integrated via JustWatch. JustWatch simplifies streaming navigation, allowing us to display where to watch movies across Netflix, Prime Video, Max, and more.
              </p>
            </div>

            <div className="space-y-6 pt-6 border-t border-zinc-900/80">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 text-xs text-zinc-500 leading-relaxed">
                Movie streaming availability and digital watch links on Reel Review are powered and attributed to the <strong className="text-zinc-300">JustWatch</strong> streaming index.
              </div>
              
              <a 
                href="https://www.justwatch.com" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-widest"
              >
                Explore JustWatch <Link2 size={12} />
              </a>
            </div>
          </div>

        </div>

        {/* License & Standards Accordion Footer */}
        <div className="mt-12 p-6 rounded-2xl bg-zinc-900/10 border border-zinc-900/80 max-w-4xl flex items-start gap-4">
          <HelpCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">Why are these attributions required?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We care about supporting original creator attribution and keeping integrations functional. Both TMDB and JustWatch APIs operate under strict Terms of Use that require clear user-facing attributions and logo identifiers to maintain database access permissions.
            </p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
