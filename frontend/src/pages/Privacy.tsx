import { ArrowLeft, Shield, Key, Database, Eye, Trash2, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export default function Privacy() {
  const navigate = useNavigate();
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "support.reelreview@bynolo.ca";

  const sections = [
    { id: "data-collection", label: "1. Information We Collect", icon: Database },
    { id: "auth", label: "2. KeyN Authentication", icon: Key },
    { id: "usage", label: "3. How We Use Data", icon: Eye },
    { id: "security", label: "4. Information Security", icon: Shield },
    { id: "rights", label: "5. Your Rights & Deletion", icon: Trash2 },
    { id: "contact", label: "6. Contact & Support", icon: Mail },
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
            Trust & Security
          </span>
          <h1 className="text-4xl md:text-5xl font-black mt-4 tracking-tighter text-white">
            Privacy Policy
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
              <h2 className="text-lg font-bold text-white mb-3">Our Commitment to Privacy</h2>
              <p className="text-sm text-zinc-400">
                At Reel Review, a platform and open-source project designed and maintained by the <strong className="text-zinc-200">byNolo</strong> programming organization, your privacy and trust are paramount. This Privacy Policy clarifies what data we collect, 
                how we handle it under our KeyN architecture, and your rights concerning your personal details, movie 
                ratings, and review history.
              </p>
            </div>

            {/* Section 1 */}
            <section id="data-collection" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Database className="text-red-600" size={20} />
                1. Information We Collect
              </h2>
              <p className="text-sm">
                We collect minimal personal data. When you interact with our service, we only capture details needed to 
                render the interactive components:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-400">
                <li><strong className="text-zinc-200">Account Details:</strong> Your username, email address, and avatar references.</li>
                <li><strong className="text-zinc-200">Ratings & Reviews:</strong> The overall and subcategory scores (story, performances, visuals, sound, enjoyment, rewatchability) and review text you submit for weekly film drops.</li>
                <li><strong className="text-zinc-200">Interactions:</strong> Review likes, reply structures, reports, and flags.</li>
                <li><strong className="text-zinc-200">Platform Analytics:</strong> We use privacy-first, cookie-less analytics (via Cloudflare) to monitor broad server traffic and page performance. This data is fully anonymized.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="auth" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Key className="text-red-600" size={20} />
                2. KeyN Authentication Gateway
              </h2>
              <p className="text-sm">
                We utilize KeyN for secure, decentralized login. When you authenticate:
              </p>
              <p className="text-sm text-zinc-400">
                We receive a secure cryptographic payload and token that identifies your unique KeyN identity. 
                We never store or have access to your passwords or private security questions. Your credentials stay strictly isolated within KeyN's auth ecosystem.
              </p>
            </section>

            {/* Section 3 */}
            <section id="usage" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Eye className="text-red-600" size={20} />
                3. How We Use Data
              </h2>
              <p className="text-sm">
                Your data is used entirely to power the cinematic interactions of Reel Review:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-400">
                <li>Calculating aggregate community film stats (score averages, ranking index, sentiment charts).</li>
                <li>Populating the discussions board (Spoiler-Free threads and the Spoiler Zone).</li>
                <li>Identifying your matching community taste peers (Perfect Matches, Closest Matches, Polar Opposites) and building Leaderboard profiles.</li>
                <li>We do <strong className="text-red-500 font-bold">NOT</strong> sell your personal data, reviews, or browsing habits to advertisers, data brokers, or third-party syndications.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="security" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Shield className="text-red-600" size={20} />
                4. Information Security
              </h2>
              <p className="text-sm">
                Our application implements strict technical guardrails to prevent data leaks. Your auth token is securely stored in local storage and sent via encrypted HTTPS transport layers. Access to the administration panel is locked behind multi-tier authorization layers.
              </p>
            </section>

            {/* Section 5 */}
            <section id="rights" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Trash2 className="text-red-600" size={20} />
                5. Your Rights & Deletion requests
              </h2>
              <p className="text-sm">
                You retain complete control of your cinematic records. If you would like to wipe your rating history or completely purge your account details, you may request account deletion by reaching out to the development team or clicking the reset tools (where applicable).
              </p>
              <p className="text-sm text-zinc-400">
                Additionally, you can toggle your review posts to <strong className="text-zinc-200">"Post Anonymously"</strong> at any time to obscure your real identity on the community takes feed.
              </p>
            </section>

            {/* Section 6 */}
            <section id="contact" className="scroll-mt-28 space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Mail className="text-red-600" size={20} />
                6. Contact & Support
              </h2>
              <p className="text-sm">
                If you have questions about this Privacy Policy, want to request the complete deletion of your 
                ratings or reviews, or need general assistance, you can contact the maintenance team at any time:
              </p>
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-900 inline-flex items-center gap-3">
                <Mail size={16} className="text-red-500" />
                <a 
                  href={`mailto:${supportEmail}`} 
                  className="text-sm font-semibold text-zinc-200 hover:text-white underline decoration-red-500/50 hover:decoration-red-500 transition-all"
                >
                  {supportEmail}
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
