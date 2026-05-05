import { apiGet, apiPost } from "../../lib/api";

export interface Genre {
  id?: number | null;
  name: string;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  category: string;
  region: string;
  link_url: string | null;
}

export interface MovieSummary {
  id: number;
  title: string;
  release_date: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  director_name: string | null;
  genres: Genre[];
  watch_providers: WatchProvider[];
}

export interface Reply {
  id: number;
  user_name: string;
  body: string;
  like_count: number;
  liked_by_me: boolean;
  created_at: string | null;
  replies: Reply[];
}

export interface Review {
  id: number;
  user_name: string;
  overall_score: number;
  review_text: string;
  is_spoiler: boolean;
  like_count: number;
  liked_by_me: boolean;
  reply_count: number;
  created_at: string | null;
  score_delta: number;
  controversy_score: number;
  replies: Reply[];
}

export interface ScoreComparison {
  delta: number;
  absolute_delta: number;
  direction: "higher" | "lower" | "equal";
}

export interface StandoutCategory {
  key: string;
  label: string;
  score: number;
}

export interface RankingNeighbor {
  rank: number;
  title: string;
  score: number;
  is_current: boolean;
}

export interface Ranking {
  id: string;
  label: string;
  rank: number;
  total_ranked: number;
  badge: string | null;
  surrounding: RankingNeighbor[];
}

export interface SubCategoryAverages {
  story?: number | null;
  performances?: number | null;
  visuals?: number | null;
  sound?: number | null;
  rewatchability?: number | null;
  enjoyment?: number | null;
  emotional_impact?: number | null;
}

export interface ResultsSummary {
  drop_id: number;
  movie: MovieSummary;
  official_score: number;
  user_score: number | null;
  total_votes: number;
  comparison: ScoreComparison | null;
  sub_categories: SubCategoryAverages;
  standout_category: StandoutCategory | null;
  rankings: Ranking[];
  reviews: Review[];
}

export type ReviewTab = "spoiler-free" | "spoilers";
export type ReviewSort = "top" | "recent" | "controversial";
export type ReportReason = "harmful_or_spam" | "spoiler";

export interface ReviewListResponse {
  items: Review[];
  total: number;
  tab: ReviewTab;
  sort: ReviewSort;
}

export interface LikeToggleResponse {
  liked: boolean;
  like_count: number;
}

export async function fetchResultsSummary(dropId: string) {
  return apiGet<ResultsSummary>(`/api/v1/results/${dropId}`, true);
}

export async function fetchResultsReviews(dropId: string, tab: ReviewTab, sort: ReviewSort) {
  return apiGet<ReviewListResponse>(
    `/api/v1/results/${dropId}/reviews?tab=${tab}&sort=${sort}`,
    true,
  );
}

export async function toggleReviewLike(reviewId: number) {
  return apiPost<LikeToggleResponse>(`/api/v1/results/reviews/${reviewId}/likes`, {}, true);
}

export async function toggleReplyLike(replyId: number) {
  return apiPost<LikeToggleResponse>(`/api/v1/results/replies/${replyId}/likes`, {}, true);
}

export async function reportReview(reviewId: number, reason: ReportReason) {
  return apiPost<{ message: string }>(
    `/api/v1/results/reviews/${reviewId}/reports`,
    { reason },
    true,
  );
}

export async function reportReply(replyId: number, reason: ReportReason) {
  return apiPost<{ message: string }>(
    `/api/v1/results/replies/${replyId}/reports`,
    { reason },
    true,
  );
}

export async function createReply(
  reviewId: number,
  body: string,
  parentReplyId?: number | null,
) {
  return apiPost<Reply>(
    `/api/v1/results/reviews/${reviewId}/replies`,
    { body, parent_reply_id: parentReplyId ?? null },
    true,
  );
}
