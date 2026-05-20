import { apiGet, apiPatch, apiPost } from "../../lib/api";
import type { FeatureSuggestion, RoadmapItem, RoadmapItemPayload, SuggestionStatus } from "./types";

type PublicRoadmapResponse = {
  items: RoadmapItem[];
  groups: Record<string, RoadmapItem[]>;
};

export function getPublicRoadmap() {
  return apiGet<PublicRoadmapResponse>("/api/v1/roadmap").then((response) => response.items);
}

export function submitFeatureSuggestion(payload: { title: string; description?: string | null }) {
  return apiPost<FeatureSuggestion>("/api/v1/feature-suggestions", payload, true);
}

export function getAdminRoadmap() {
  return apiGet<RoadmapItem[]>("/api/v1/admin/roadmap", true);
}

export function createAdminRoadmapItem(payload: RoadmapItemPayload) {
  return apiPost<RoadmapItem>("/api/v1/admin/roadmap", payload, true);
}

export function updateAdminRoadmapItem(id: number, payload: Partial<RoadmapItemPayload>) {
  return apiPatch<RoadmapItem>(`/api/v1/admin/roadmap/${id}`, payload, true);
}

export function getAdminFeatureSuggestions(status: SuggestionStatus | "all" = "pending") {
  return apiGet<FeatureSuggestion[]>(`/api/v1/admin/feature-suggestions?status=${status}`, true);
}

export function approveFeatureSuggestion(
  id: number,
  payload: { admin_note?: string | null; roadmap_item: RoadmapItemPayload },
) {
  return apiPost<{ suggestion: FeatureSuggestion; roadmap_item: RoadmapItem }>(
    `/api/v1/admin/feature-suggestions/${id}/approve`,
    payload,
    true,
  );
}

export function rejectFeatureSuggestion(id: number, payload: { admin_note?: string | null }) {
  return apiPost<FeatureSuggestion>(`/api/v1/admin/feature-suggestions/${id}/reject`, payload, true);
}
