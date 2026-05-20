import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoadmapPage from "./RoadmapPage";
import type { RoadmapItem } from "../types";

const mockUseAuth = vi.fn();

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../../components/SiteHeader", () => ({
  SiteHeader: () => <div>Header</div>,
}));

vi.mock("../../../components/SiteFooter", () => ({
  SiteFooter: () => <div>Footer</div>,
}));

vi.mock("../api", () => ({
  getPublicRoadmap: vi.fn(),
  submitFeatureSuggestion: vi.fn(),
}));

const { getPublicRoadmap, submitFeatureSuggestion } = await import("../api");

const roadmapItems: RoadmapItem[] = [
  {
    id: 1,
    title: "Watch party RSVP",
    description: "Coordinate attendance for weekly drops.",
    status: "next",
    is_public: true,
    sort_order: 1,
  },
];

describe("RoadmapPage", () => {
  beforeEach(() => {
    vi.mocked(getPublicRoadmap).mockReset();
    vi.mocked(submitFeatureSuggestion).mockReset();
  });

  it("renders public roadmap items and signed-out call to action", async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn() });
    vi.mocked(getPublicRoadmap).mockResolvedValue(roadmapItems);

    render(<RoadmapPage />);

    await waitFor(() => {
      expect(screen.getByText("Watch party RSVP")).toBeInTheDocument();
    });

    expect(screen.getByText("Coordinate attendance for weekly drops.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign in to suggest/i })).toBeInTheDocument();
  });

  it("lets signed-in users submit a feature suggestion", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: "member", is_admin: false },
      loading: false,
      login: vi.fn(),
    });
    vi.mocked(getPublicRoadmap).mockResolvedValue(roadmapItems);
    vi.mocked(submitFeatureSuggestion).mockResolvedValue({
      id: 10,
      user_id: 1,
      username: "member",
      title: "Calendar invites",
      description: "Add drops to a calendar.",
      status: "pending",
    });

    render(<RoadmapPage />);

    await userEvent.type(screen.getByPlaceholderText(/What should Reel Review add next/i), "Calendar invites");
    await userEvent.type(screen.getByPlaceholderText(/What problem would this solve/i), "Add drops to a calendar.");
    await userEvent.click(screen.getByRole("button", { name: /Submit Suggestion/i }));

    await waitFor(() => {
      expect(submitFeatureSuggestion).toHaveBeenCalledWith({
        title: "Calendar invites",
        description: "Add drops to a calendar.",
      });
    });
    expect(screen.getByText(/Suggestion sent/i)).toBeInTheDocument();
  });
});
