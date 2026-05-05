import { useState } from "react";
import { Award, Flag, MessageSquare, TrendingUp, User } from "lucide-react";

import type { ReportReason, Review } from "../api";
import { ReviewThread } from "./ReviewThread";

interface ReviewCardProps {
  review: Review;
  isHighestMatch?: boolean;
  officialScore: number;
  onToggleLike: (reviewId: number) => Promise<void>;
  onToggleReplyLike: (replyId: number) => Promise<void>;
  onReportReview: (reviewId: number, reason: ReportReason) => Promise<void>;
  onReportReply: (replyId: number, reason: ReportReason) => Promise<void>;
  onSubmitReply: (reviewId: number, body: string, parentReplyId?: number) => Promise<void>;
}

export function ReviewCard({
  review,
  isHighestMatch,
  officialScore,
  onToggleLike,
  onToggleReplyLike,
  onReportReview,
  onReportReply,
  onSubmitReply,
}: ReviewCardProps) {
  const isMatch = review.overall_score >= officialScore;
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [showReportChoices, setShowReportChoices] = useState(false);

  const relationText =
    review.score_delta === 0
      ? "Right on the community average"
      : `${Math.abs(review.score_delta)} pts ${review.score_delta > 0 ? "above" : "below"} average`;

  return (
    <div className="p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700">
            <User size={20} />
          </div>
          <div>
            <div className="font-bold text-zinc-200 flex items-center gap-2">
              {review.user_name}
              {isHighestMatch && (
                <span title="Highest community match to your taste">
                  <Award size={14} className="text-amber-500" />
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-500">
              {review.user_name === "Anonymous" ? "Secret Voter" : relationText}
            </div>
          </div>
        </div>

        {/* User's Score Pill */}
        <div className={`px-3 py-1 rounded-lg text-sm font-black tabular-nums border ${isMatch ? 'bg-green-950/30 text-green-400 border-green-900/50' : 'bg-amber-950/30 text-amber-500 border-amber-900/50'}`}>
          {review.overall_score}
        </div>
      </div>

      <p className="text-zinc-300 leading-relaxed text-[15px] whitespace-pre-wrap">
        {review.review_text}
      </p>

      <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => void onToggleLike(review.id)}
            className={`text-xs font-bold transition-colors flex items-center gap-1.5 ${review.liked_by_me ? "text-red-400" : "text-zinc-500 hover:text-white"}`}
          >
            <TrendingUp size={14} /> {review.like_count}
          </button>
          <button
            onClick={() => setIsReplying((value) => !value)}
            className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <MessageSquare size={14} /> Reply
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowReportChoices((value) => !value)}
            className="text-xs font-bold text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1.5"
            title="Report as harmful, spam, or spoiler"
          >
            <Flag size={14} /> Report
          </button>
          {showReportChoices ? (
            <div className="absolute top-full right-0 mt-2 w-44 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-20">
              <button
                onClick={() => {
                  setShowReportChoices(false);
                  void onReportReview(review.id, "harmful_or_spam");
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-900"
              >
                Harmful/Spam
              </button>
              <button
                onClick={() => {
                  setShowReportChoices(false);
                  void onReportReview(review.id, "spoiler");
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-900"
              >
                Spoiler
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {isReplying ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600"
            placeholder="Join the conversation..."
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!replyBody.trim()) return;
                await onSubmitReply(review.id, replyBody);
                setReplyBody("");
                setIsReplying(false);
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
            >
              Post Reply
            </button>
            <button
              onClick={() => {
                setReplyBody("");
                setIsReplying(false);
              }}
              className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {review.replies.length > 0 ? (
        <div className="mt-4 space-y-3 border-l border-zinc-800 pl-4">
          {review.replies.map((reply) => (
            <ReviewThread
              key={reply.id}
              reply={reply}
              onToggleLike={onToggleReplyLike}
              onReport={onReportReply}
              onSubmitReply={(parentReplyId, body) =>
                onSubmitReply(review.id, body, parentReplyId)
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
