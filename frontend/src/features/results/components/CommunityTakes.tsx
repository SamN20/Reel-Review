import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  Flame,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
  Trophy,
} from "lucide-react";

import {
  createReply,
  fetchResultsReviews,
  reportReply,
  reportReview,
  toggleReplyLike,
  toggleReviewLike,
  type Review,
  type ReviewSort,
  type ReviewTab,
} from "../api";
import { ReviewCard } from "./ReviewCard";

interface CommunityTakesProps {
  dropId: number;
  initialReviews: Review[];
  officialScore: number;
  userScore: number | null;
}

export function CommunityTakes({
  dropId,
  initialReviews,
  officialScore,
  userScore,
}: CommunityTakesProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>("spoiler-free");
  const [activeSort, setActiveSort] = useState<ReviewSort>("top");
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshReviews = useCallback(async (tab = activeTab, sort = activeSort) => {
    // Use a local variable to decide whether to set loading to true.
    // We only want a hard loading flash if we don't have data yet.
    let isInitialLoad = false;
    setReviews((current) => {
      if (current.length === 0) {
        isInitialLoad = true;
      }
      return current;
    });

    if (isInitialLoad) setLoading(true);
    
    try {
      const response = await fetchResultsReviews(String(dropId), tab, sort);
      setReviews(response.items);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load community takes.");
    } finally {
      setLoading(false);
    }
  }, [activeSort, activeTab, dropId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshReviews();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshReviews]);

  const activeReviews = reviews;
  const targetScore = userScore ?? officialScore;
  const perfectMatch =
    activeReviews.length > 0
      ? [...activeReviews].sort(
          (left, right) =>
            Math.abs(left.overall_score - targetScore) -
            Math.abs(right.overall_score - targetScore),
        )[0]
      : null;
  const polarOpposite =
    activeReviews.length > 1
      ? [...activeReviews].sort(
          (left, right) =>
            Math.abs(right.overall_score - targetScore) -
            Math.abs(left.overall_score - targetScore),
        )[0]
      : null;

  const updateReviewLikeState = (reviewId: number, likeCount: number, liked: boolean) => {
    setReviews((currentReviews) =>
      currentReviews.map((review) =>
        review.id === reviewId
          ? { ...review, like_count: likeCount, liked_by_me: liked }
          : review,
      ),
    );
  };

  const updateReplyLikeState = (
    reviewList: Review[],
    replyId: number,
    likeCount: number,
    liked: boolean,
  ): Review[] =>
    reviewList.map((review) => ({
      ...review,
      replies: review.replies.map((reply) =>
        updateReplyNode(reply, replyId, likeCount, liked),
      ),
    }));

  const updateReplyNode = (
    reply: Review["replies"][number],
    replyId: number,
    likeCount: number,
    liked: boolean,
  ): Review["replies"][number] => {
    if (reply.id === replyId) {
      return { ...reply, like_count: likeCount, liked_by_me: liked };
    }
    return {
      ...reply,
      replies: reply.replies.map((childReply) =>
        updateReplyNode(childReply, replyId, likeCount, liked),
      ),
    };
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="text-zinc-400" size={24} /> Community Takes
        </h2>

        {/* Spoiler Toggle */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 w-fit shrink-0">
          <button
            onClick={() => setActiveTab('spoiler-free')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'spoiler-free' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Spoiler-Free
          </button>
          <button
            onClick={() => setActiveTab('spoilers')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'spoilers' ? 'bg-red-950/50 text-red-500 shadow-md border border-red-900/50' : 'text-zinc-500 hover:text-red-400'}`}
          >
            <ShieldAlert size={14} /> Spoiler Zone
          </button>
        </div>
      </div>

      {/* Filter / Sort Bar */}
      {!(activeTab === "spoilers" && !showSpoilers) && (
        <div className="flex items-center gap-5 mb-6 text-sm border-b border-zinc-900 pb-4">
          <button
            onClick={() => setActiveSort("top")}
            className={`flex items-center gap-1.5 font-semibold ${activeSort === "top" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <TrendingUp size={16} className="text-red-500" /> Top Rated Comments
          </button>
          <button
            onClick={() => setActiveSort("recent")}
            className={activeSort === "recent" ? "text-white font-semibold" : "text-zinc-500 hover:text-zinc-300 font-medium"}
          >
            Most Recent
          </button>
          <button
            onClick={() => setActiveSort("controversial")}
            className={activeSort === "controversial" ? "text-white font-semibold" : "text-zinc-500 hover:text-zinc-300 font-medium"}
          >
            Controversial
          </button>
        </div>
      )}

      {activeTab === 'spoiler-free' ? (
        <>
          {/* MATCH CARDS (Perfect Match vs Polar Opposite) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {perfectMatch && (
              <div className="bg-green-950/10 border border-green-900/40 rounded-2xl p-5 flex flex-col justify-between hover:bg-green-950/20 transition-colors">
                <div>
                  <div className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-widest mb-3">
                    <Trophy size={14} /> {userScore ? 'Perfect Match' : 'Community Favorite'}
                  </div>
                  <p className="text-zinc-200 text-[15px] italic font-medium leading-relaxed mb-6">
                    "{perfectMatch.review_text.substring(0, 100)}{perfectMatch.review_text.length > 100 ? '...' : ''}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-green-900/30">
                  <div className="w-10 h-10 rounded-full border border-green-900/50 bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                    {perfectMatch.user_name[0].toUpperCase()}
                  </div>
                    <div>
                    <div className="font-bold text-white text-sm">{perfectMatch.user_name}</div>
                    <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                      Rated {perfectMatch.overall_score} • {userScore ? 'Same As You' : 'Top Rated'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {polarOpposite && (
              <div className="bg-red-950/10 border border-red-900/40 rounded-2xl p-5 flex flex-col justify-between hover:bg-red-950/20 transition-colors">
                <div>
                  <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest mb-3">
                    <Flame size={14} /> {userScore ? 'Polar Opposite' : 'Hot Take'}
                  </div>
                  <p className="text-zinc-200 text-[15px] italic font-medium leading-relaxed mb-6">
                    "{polarOpposite.review_text.substring(0, 100)}{polarOpposite.review_text.length > 100 ? '...' : ''}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-red-900/30">
                  <div className="w-10 h-10 rounded-full border border-red-900/50 bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                    {polarOpposite.user_name[0].toUpperCase()}
                  </div>
                    <div>
                    <div className="font-bold text-white text-sm">{polarOpposite.user_name}</div>
                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                      Rated {polarOpposite.overall_score} • {userScore ? `${Math.abs(userScore - polarOpposite.overall_score)} Diff` : `${Math.round(Math.abs(officialScore - polarOpposite.overall_score))} vs Avg`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div key={activeSort} className="flex flex-col animate-in fade-in duration-500">
            {loading ? (
              <div className="p-8 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                Loading community takes...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-400 bg-red-950/10 rounded-2xl border border-dashed border-red-900/40">
                {error}
              </div>
            ) : activeReviews.length > 0 ? (
              activeReviews.map((review, i) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  officialScore={officialScore}
                  isHighestMatch={i === 0}
                  onToggleLike={async (reviewId) => {
                    const response = await toggleReviewLike(reviewId);
                    updateReviewLikeState(reviewId, response.like_count, response.liked);
                  }}
                  onToggleReplyLike={async (replyId) => {
                    const response = await toggleReplyLike(replyId);
                    setReviews((currentReviews) =>
                      updateReplyLikeState(
                        currentReviews,
                        replyId,
                        response.like_count,
                        response.liked,
                      ),
                    );
                  }}
                  onReportReview={async (reviewId, reason) => {
                    await reportReview(reviewId, reason);
                    await refreshReviews();
                  }}
                  onReportReply={async (replyId, reason) => {
                    await reportReply(replyId, reason);
                    await refreshReviews();
                  }}
                  onSubmitReply={async (reviewId, body, parentReplyId) => {
                    await createReply(reviewId, body, parentReplyId ?? null);
                    await refreshReviews();
                  }}
                />
              ))
            ) : (
              <div className="p-8 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                No spoiler-free reviews yet. Be the first!
              </div>
            )}
            {activeReviews.length > 0 ? (
              <div className="w-full py-4 text-sm font-bold text-zinc-500 flex items-center justify-center gap-2 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
                {activeReviews.length} Takes Loaded <ChevronDown size={16} />
              </div>
            ) : null}
          </div>
        </>
      ) : (
        // Spoiler Zone State
        <div>
          {!showSpoilers ? (
            <div className="p-12 border border-red-900/50 bg-red-950/10 rounded-2xl flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
              <ShieldAlert size={48} className="text-red-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">You are entering the Spoiler Zone</h3>
              <p className="text-zinc-400 max-w-md mb-6">
                Reviews in this section discuss major plot points, twists, and endings. Do not proceed if you haven't seen the film.
              </p>
              <button 
                onClick={() => {
                  setShowSpoilers(true);
                  setActiveTab("spoilers");
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
              >
                Acknowledge & Reveal Spoilers
              </button>
            </div>
          ) : (
            <div key={activeSort} className="flex flex-col animate-in fade-in duration-500">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                  Loading spoiler takes...
                </div>
              ) : activeReviews.length > 0 ? (
                activeReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    officialScore={officialScore}
                    onToggleLike={async (reviewId) => {
                      const response = await toggleReviewLike(reviewId);
                      updateReviewLikeState(reviewId, response.like_count, response.liked);
                    }}
                    onToggleReplyLike={async (replyId) => {
                      const response = await toggleReplyLike(replyId);
                      setReviews((currentReviews) =>
                        updateReplyLikeState(
                          currentReviews,
                          replyId,
                          response.like_count,
                          response.liked,
                        ),
                      );
                    }}
                    onReportReview={async (reviewId, reason) => {
                      await reportReview(reviewId, reason);
                      await refreshReviews();
                    }}
                    onReportReply={async (replyId, reason) => {
                      await reportReply(replyId, reason);
                      await refreshReviews();
                    }}
                    onSubmitReply={async (reviewId, body, parentReplyId) => {
                      await createReply(reviewId, body, parentReplyId ?? null);
                      await refreshReviews();
                    }}
                  />
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                  No spoiler reviews yet.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
