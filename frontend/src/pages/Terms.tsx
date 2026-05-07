import { ArrowLeft, ShieldCheck, Scale, Globe, UserCheck, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export default function Terms() {
  const navigate = useNavigate();

  const sections = [
    { id: "acceptance", label: "1. Acceptance of Terms", icon: Scale },
    { id: "conduct", label: "2. Community Conduct", icon: UserCheck },
    { id: "content", label: "3. User Generated Content", icon: Globe },
    { id: "intellectual", label: "4. Intellectual Property", icon: ShieldCheck },
    { id: "disclaimers", label: "5. Disclaimers & Limits", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-red-600 selection:text-white">
      <SiteHeader />

      {/* Title Hero Banner */}
      <div className="relative pt-28 pb-12 overflow-hidden border-b border-zinc-900 bg-gradient-to-b from-zinc-900/20 via-zinc-950 to-zinc-950">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.05),_transparent_40%)]"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest mb-6"
          >
            <ArrowLeft size={14} /> Go Back
          </button>
          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-950/25 border border-red-900/40 px-3 py-1 rounded">
            Legal & Framework
          </span>
          <h1 className="text-4xl md:text-5xl font-black mt-4 tracking-tighter text-white">
            Terms of Use
          </h1>
          <p className="text-zinc-500 text-xs uppercase tracking-wider mt-2 font-bold">
            Last Updated: May 2026 • Version 1.2
          </p>
        </div>
      </div>

      {/* Page Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Table of Contents Sidebar */}
          <aside className="w-full lg:w-64 shrink-0 hidden lg:block">
            <div className="sticky top-28 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                Table of Contents
              </h3>
              <nav className="flex flex-col gap-2">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="group flex items-center gap-3 py-2 px-3 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all"
                    >
                      <Icon size={16} className="text-zinc-500 group-hover:text-red-500 transition-colors" />
                      {sec.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Legal Content Block */}
          <div className="flex-1 space-y-12 text-zinc-300 leading-relaxed max-w-3xl">
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <h2 className="text-lg font-bold text-white mb-3">Welcome to Reel Review</h2>
              <p className="text-sm text-zinc-400">
                These Terms of Use govern your access to and use of Reel Review, a community-driven film platform and open-source project created and maintained by the <strong className="text-zinc-200">byNolo</strong> programming organization. By authenticating your account or submitting a cinematic
                vote, you agree to be legally bound by these terms. If you do not accept these terms, you may not
                participate in the weekly drops.
              </p>
            </div>

            {/* Section 1 */}
            <section id="acceptance" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Scale className="text-red-600" size={20} />
                1. Acceptance of Terms
              </h2>
              <p className="text-sm">
                By creating an account, authenticating via KeyN, or writing reviews on this website, you represent
                and warrant that you are of legal age to form a binding contract and that you accept all rules,
                formatting guardrails, and community moderation workflows. We reserve the right to revise or
                update these terms at any time. Any changes will be posted with an updated "Last Updated" timestamp.
              </p>
            </section>

            {/* Section 2 */}
            <section id="conduct" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <UserCheck className="text-red-600" size={20} />
                2. Community Conduct & Civility
              </h2>
              <p className="text-sm">
                Reel Review is built for constructive cinephile engagement. Users must respect the community:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-400">
                <li>
                  <strong className="text-zinc-200">The Spoiler Rule:</strong> If a review or discussion reply details plot points, twists, or endings, you <strong className="text-red-500 font-bold">MUST</strong> toggle the "Mark as Spoiler" check box. Failure to do so may result in review moderation or account restriction.
                </li>
                <li>
                  <strong className="text-zinc-200">No Harassment:</strong> Healthy disagreement on cinematography, acting, or story pacing is encouraged. Personal attacks, slurs, threats, or hate speech are strictly prohibited.
                </li>
                <li>
                  <strong className="text-zinc-200">System Integrity:</strong> Manipulating ratings, creating multiple mock accounts to spam low ratings (review bombing), or scripting submissions is an abuse of the system.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="content" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Globe className="text-red-600" size={20} />
                3. User Generated Content
              </h2>
              <p className="text-sm">
                You retain ownership of any text reviews or ratings you publish on the platform. However, by
                publishing content on Reel Review, you grant us a worldwide, royalty-free, perpetual license to
                host, display, distribute, analyze, and surface your reviews in aggregations, leaderboards, and historical shelves.
              </p>
              <p className="text-sm text-zinc-400">
                You are solely responsible for your own content. We operate automatic moderation workflows and reserve
                the absolute right (but assume no obligation) to hide, delete, or flag any reviews or replies that violate our guidelines.
              </p>
            </section>

            {/* Section 4 */}
            <section id="intellectual" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <ShieldCheck className="text-red-600" size={20} />
                4. Intellectual Property
              </h2>
              <p className="text-sm">
                The Reel Review name, logos, brand configurations, system styling, rating bar components, design system configurations,
                and unique layouts are the intellectual property of <strong className="text-zinc-200">byNolo</strong>.
              </p>
              <p className="text-sm text-zinc-400">
                Movie metadata, backdrops, poster artwork, director summaries, and streaming provider information are ingested
                from third-party databases, including TMDB and JustWatch, and are protected under their respective trademarks and copyrights.
              </p>
            </section>

            {/* Section 5 */}
            <section id="disclaimers" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <AlertTriangle className="text-red-600" size={20} />
                5. Disclaimers & Limits of Liability
              </h2>
              <p className="text-sm">
                Reel Review is provided on an "as is" and "as available" basis by <strong className="text-zinc-200">byNolo</strong> without warranties of any kind, whether express or implied.
                We do not guarantee the completeness or accuracy of third-party movie metadata, streaming availability links, or watch party schedules.
              </p>
              <p className="text-sm text-zinc-400">
                In no event shall <strong className="text-zinc-300">byNolo</strong>, Reel Review, or its team be liable for any indirect, incidental, special, or consequential damages resulting
                from your use of the discussions, reviews, or platform features.
              </p>
            </section>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
