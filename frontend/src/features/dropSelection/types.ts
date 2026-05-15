import type { MovieSummary } from "../results/api";

export type DropSelectionSource = "smart" | "wildcard" | "fallback";

export type WeeklyDropOption = {
  id: number;
  movie: MovieSummary;
  display_order: number;
  source: DropSelectionSource;
  smart_score: number;
};

export type WeeklyDropBallot = {
  target_drop_id: number;
  ranked_movie_ids: number[];
  updated_at: string | null;
};

export type NextVote = {
  target_drop_id: number;
  source_drop_id: number;
  start_date: string;
  end_date: string;
  locked: boolean;
  options: WeeklyDropOption[];
  ballot: WeeklyDropBallot | null;
};
