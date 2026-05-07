import { apiGet } from "../../lib/api";

export interface ArchiveGenre {
  id?: number | null;
  name: string;
}

export interface ArchiveWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  category: string;
  region: string;
  link_url: string | null;
}

export interface ArchiveMovie {
  id: number;
  title: string;
  release_date: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  director_name: string | null;
  genres: ArchiveGenre[];
  watch_providers: ArchiveWatchProvider[];
}

export interface ArchiveMovieItem {
  drop_id: number;
  movie: ArchiveMovie;
  start_date: string;
  end_date: string;
  community_score: number | null;
  total_votes: number;
  user_has_rated: boolean;
  user_score: number | null;
  rank: number | null;
  divisiveness: number | null;
}

export type ArchiveShelfKind = "missed" | "top_rated" | "chronological" | "divisive";

export interface ArchiveShelf {
  id: string;
  title: string;
  description: string | null;
  kind: ArchiveShelfKind;
  items: ArchiveMovieItem[];
  total_count: number;
  view_all_path: string | null;
}

export interface ArchiveShelvesResponse {
  shelves: ArchiveShelf[];
}

export interface ArchiveVoteOrderResponse {
  items: ArchiveMovieItem[];
  total: number;
  limit: number;
  offset: number;
}

export function fetchArchiveShelves(authenticated: boolean) {
  return apiGet<ArchiveShelvesResponse>("/api/v1/archive/shelves", authenticated);
}

export function fetchArchiveVoteOrder(authenticated: boolean, limit = 120, offset = 0) {
  return apiGet<ArchiveVoteOrderResponse>(
    `/api/v1/archive/vote-order?limit=${limit}&offset=${offset}`,
    authenticated,
  );
}
