export interface ProfileMovie {
  id: number;
  title: string;
  poster_path: string | null;
}

export interface ProfileRating {
  overall_score: number;
  movie: ProfileMovie;
  created_at: string;
  weekly_drop_id: number | null;
}

export interface UserProfile {
  id: number;
  username: string;
  display_name: string | null;
  use_display_name: boolean;
  total_votes: number;
  average_score: number;
  recent_ratings: ProfileRating[];
  favorite_movies: ProfileRating[];
}

export interface ReferralUser {
  id: number;
  username: string;
  display_name: string | null;
  use_display_name: boolean;
  referral_attributed_at: string | null;
}

export interface ReferralSummary {
  invite_code: string;
  invite_url: string;
  referral_count: number;
  referred_users: ReferralUser[];
}

export type ProfileTab = "recent" | "favorites" | "invites" | "settings";
