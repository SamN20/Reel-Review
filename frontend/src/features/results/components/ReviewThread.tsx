import { useState } from "react";
import { Flag, MessageSquare, TrendingUp, User, ChevronDown, ChevronUp } from "lucide-react";

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

  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = reply.body.length > 250;

  const [showReplies, setShowReplies] = useState(reply.replies.length <= 2);

  const handleReplySubmit = async () => {
    if (!replyBody.trim()) return;
    await onSubmitReply(reply.id, replyBody);
    setReplyBody("");
    setIsReplying(false);
    setShowReplies(true);
  };

  return (
    <div className="space-y-3 pt-2">
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

      <div className="relative">
        <p className={`text-sm text-zinc-300 whitespace-pre-wrap ${!isExpanded && isLongText ? "line-clamp-4" : ""}`}>
          {reply.body}
        </p>
        {isLongText && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-red-500 hover:text-red-400 mt-1 transition-colors"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

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
        {reply.replies.length > 2 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 ml-1"
          >
            {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showReplies ? "Hide Replies" : `Show Replies (${reply.replies.length})`}
          </button>
        )}
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
            autoFocus
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void handleReplySubmit();
              }
            }}
            rows={3}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600"
            placeholder="Write a reply... (Ctrl+Enter to submit)"
          />
          <div className="flex gap-2">
            <button
              onClick={() => void handleReplySubmit()}
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
        <div 
          className={`grid transition-all duration-300 ease-in-out ${
            showReplies ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-3 space-y-4 border-l-2 border-zinc-800/50 pl-5 ml-2">
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
