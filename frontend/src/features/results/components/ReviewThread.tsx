import { useState } from "react";
import { Flag, MessageSquare, TrendingUp, User } from "lucide-react";

import type { Reply, ReportReason } from "../api";

interface ReviewThreadProps {
  reply: Reply;
  onToggleLike: (replyId: number) => Promise<void>;
  onReport: (replyId: number, reason: ReportReason) => Promise<void>;
  onSubmitReply: (parentReplyId: number, body: string) => Promise<void>;
}

export function ReviewThread({
  reply,
  onToggleLike,
  onReport,
  onSubmitReply,
}: ReviewThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [showReportChoices, setShowReportChoices] = useState(false);

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700">
            <User size={16} />
          </div>
          <div>
            <div className="font-bold text-zinc-200 text-sm">{reply.user_name}</div>
            <div className="text-xs text-zinc-500">
              {reply.created_at ? new Date(reply.created_at).toLocaleString() : "Just now"}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{reply.body}</p>

      <div className="flex items-center gap-4 text-xs">
        <button
          onClick={() => void onToggleLike(reply.id)}
          className={`font-bold transition-colors flex items-center gap-1.5 ${reply.liked_by_me ? "text-red-400" : "text-zinc-500 hover:text-white"}`}
        >
          <TrendingUp size={14} /> {reply.like_count}
        </button>
        <button
          onClick={() => setIsReplying((value) => !value)}
          className="font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <MessageSquare size={14} /> Reply
        </button>
        <div className="relative">
          <button
            onClick={() => setShowReportChoices((value) => !value)}
            className="font-bold text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1.5"
          >
            <Flag size={14} /> Report
          </button>
          {showReportChoices ? (
            <div className="absolute top-full left-0 mt-2 w-44 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-20">
              <button
                onClick={() => {
                  setShowReportChoices(false);
                  void onReport(reply.id, "harmful_or_spam");
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-900"
              >
                Harmful/Spam
              </button>
              <button
                onClick={() => {
                  setShowReportChoices(false);
                  void onReport(reply.id, "spoiler");
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
        <div className="space-y-2">
          <textarea
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600"
            placeholder="Write a reply..."
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!replyBody.trim()) return;
                await onSubmitReply(reply.id, replyBody);
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

      {reply.replies.length > 0 ? (
        <div className="space-y-3 border-l border-zinc-800 pl-4">
          {reply.replies.map((childReply) => (
            <ReviewThread
              key={childReply.id}
              reply={childReply}
              onToggleLike={onToggleLike}
              onReport={onReport}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
