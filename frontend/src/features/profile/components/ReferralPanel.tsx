import { Copy, Users } from "lucide-react";

import type { ReferralSummary } from "../types";

interface ReferralPanelProps {
  referralSummary: ReferralSummary | null;
  copyStatus: "idle" | "copied" | "error";
  onCopy: () => void;
}

export function ReferralPanel({
  referralSummary,
  copyStatus,
  onCopy,
}: ReferralPanelProps) {
  return (
    <div className="max-w-3xl">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Invite Friends</p>
            <h2 className="mt-2 text-xl font-bold">Your Invite Link</h2>
            <p className="mt-2 text-sm text-zinc-400">Share your link and Reel Review will attribute new member signups back to your profile.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-950/30 px-3 py-1 text-xs font-semibold text-red-200">
            <Users className="h-3.5 w-3.5" />
            {referralSummary?.referral_count ?? 0} referrals
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Invite URL</p>
          <p className="mt-2 break-all text-sm text-zinc-200">{referralSummary?.invite_url ?? "Loading invite link..."}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onCopy}
              disabled={!referralSummary?.invite_url}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              Copy Invite Link
            </button>
            <span className="text-xs text-zinc-500">
              {copyStatus === "copied" ? "Copied to clipboard." : copyStatus === "error" ? "Could not copy automatically." : `Code: ${referralSummary?.invite_code ?? "..."}`}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Referred Members</h3>
          {referralSummary && referralSummary.referred_users.length > 0 ? (
            <div className="mt-4 divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-950/40">
              {referralSummary.referred_users.map((referredUser) => {
                const preferredReferredName =
                  referredUser.use_display_name && referredUser.display_name
                    ? referredUser.display_name
                    : referredUser.username;
                return (
                  <div key={referredUser.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{preferredReferredName}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">@{referredUser.username}</p>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {referredUser.referral_attributed_at
                        ? new Date(referredUser.referral_attributed_at).toLocaleDateString()
                        : "Pending"}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">No referred members yet. Share your link to start building your crew.</p>
          )}
        </div>
      </div>
    </div>
  );
}
