import { apiDelete, apiGet, apiPatch, apiPost } from "../../lib/api";

export type WatchPartyHostMode = "bynolo_discord" | "custom_link";
export type WatchPartyRsvpStatus = "going" | "not_going";
export type WatchPartyStatus = "scheduled" | "cancelled";

export interface WatchPartyDiscordChannel {
  key: string;
  label: string;
  link_url: string;
  description: string;
}

export interface WatchPartyBoardDrop {
  id: number;
  movie_title: string;
  start_date: string;
  end_date: string;
}

export interface WatchParty {
  id: number;
  weekly_drop_id: number;
  title: string;
  host_mode: WatchPartyHostMode;
  status: WatchPartyStatus;
  scheduled_for: string;
  timezone_label: string;
  region: string | null;
  platform: string | null;
  capacity: number | null;
  notes: string | null;
  visibility_hint: string | null;
  host_display_name: string;
  destination_label: string;
  destination_url: string;
  destination_description: string;
  discord_channel_key: string | null;
  rsvp_count: number;
  viewer_rsvp_status: WatchPartyRsvpStatus | null;
  can_edit: boolean;
  can_cancel: boolean;
  is_past: boolean;
}

export interface WatchPartyBoard {
  drop: WatchPartyBoardDrop;
  parties: WatchParty[];
  available_discord_channels: WatchPartyDiscordChannel[];
}

export interface WatchPartyPayload {
  title: string;
  host_mode: WatchPartyHostMode;
  external_url?: string | null;
  discord_channel_key?: string | null;
  scheduled_for: string;
  timezone_label: string;
  region?: string | null;
  platform?: string | null;
  capacity?: number | null;
  notes?: string | null;
  visibility_hint?: string | null;
}

export interface WatchPartyDiscordSettings {
  channels: WatchPartyDiscordChannel[];
}

export async function fetchCurrentWatchPartyBoard() {
  return apiGet<WatchPartyBoard>("/api/v1/watch-parties/current", true);
}

export async function createWatchParty(payload: WatchPartyPayload) {
  return apiPost<WatchParty>("/api/v1/watch-parties/", payload, true);
}

export async function updateWatchParty(id: number, payload: Partial<WatchPartyPayload>) {
  return apiPatch<WatchParty>(`/api/v1/watch-parties/${id}`, payload, true);
}

export async function updateWatchPartyRsvp(id: number, status: WatchPartyRsvpStatus) {
  return apiPost<WatchParty>(`/api/v1/watch-parties/${id}/rsvp`, { status }, true);
}

export async function cancelWatchParty(id: number) {
  return apiDelete<{ message: string }>(`/api/v1/watch-parties/${id}`, true);
}
