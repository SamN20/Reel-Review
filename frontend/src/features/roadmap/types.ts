export type RoadmapStatus = "now" | "next" | "later" | "shipped";
export type SuggestionStatus = "pending" | "approved" | "rejected";

export type RoadmapItem = {
  id: number;
  title: string;
  description?: string | null;
  status: RoadmapStatus;
  is_public: boolean;
  sort_order: number;
  cta_label?: string | null;
  cta_url?: string | null;
  source_suggestion_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  shipped_at?: string | null;
};

export type FeatureSuggestion = {
  id: number;
  user_id: number;
  username: string;
  title: string;
  description?: string | null;
  status: SuggestionStatus;
  admin_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  promoted_item_id?: number | null;
};

export type RoadmapItemPayload = {
  title: string;
  description?: string | null;
  status: RoadmapStatus;
  is_public: boolean;
  sort_order: number;
  cta_label?: string | null;
  cta_url?: string | null;
  source_suggestion_id?: number | null;
};
