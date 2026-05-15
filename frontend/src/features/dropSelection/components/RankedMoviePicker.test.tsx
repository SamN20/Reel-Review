import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach } from "vitest";
import { RankedMoviePicker } from "./RankedMoviePicker";
import { submitNextMovieBallot } from "../api";
import type { NextVote } from "../types";

vi.mock("../api", () => ({
  submitNextMovieBallot: vi.fn(),
}));

// Make hasCompletedOnboarding return true so the intro is never shown in tests.
vi.mock("../onboarding", () => ({
  hasCompletedOnboarding: () => true,
  markOnboardingComplete: () => undefined,
  ONBOARDING_KEY_VOTE: "rr_has_voted",
  ONBOARDING_KEY_RANK: "rr_has_ranked",
  resetOnboarding: () => undefined,
}));

// Stub axios so the onboarding settings API call resolves immediately.
vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  return {
    ...actual,
    default: {
      ...actual.default,
      get: vi.fn().mockResolvedValue({ data: { always_play: false } }),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

// Render a thin stub for DraftSuccessOverlay that fires onDone immediately.
vi.mock("./DraftSuccessOverlay", () => ({
  DraftSuccessOverlay: ({ onDone }: { onDone: () => void }) => {
    // Call synchronously — by the time this renders the API has already been called.
    onDone();
    return <div data-testid="draft-success" />;
  },
}));

const nextVote: NextVote = {
  target_drop_id: 8,
  source_drop_id: 7,
  start_date: "2026-05-18",
  end_date: "2026-05-24",
  locked: false,
  ballot: null,
  options: [
    {
      id: 1,
      display_order: 0,
      source: "smart",
      smart_score: 10,
      movie: {
        id: 101,
        title: "Alpha",
        overview: "First option",
        poster_path: null,
        backdrop_path: null,
        director_name: null,
        release_date: null,
        genres: [],
        watch_providers: [],
      },
    },
    {
      id: 2,
      display_order: 1,
      source: "wildcard",
      smart_score: 0,
      movie: {
        id: 202,
        title: "Beta",
        overview: "Second option",
        poster_path: null,
        backdrop_path: null,
        director_name: null,
        release_date: null,
        genres: [],
        watch_providers: [],
      },
    },
  ],
};

describe("RankedMoviePicker", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("drafts a movie, calls the API, and shows the success overlay", async () => {
    vi.mocked(submitNextMovieBallot).mockResolvedValue({
      target_drop_id: 8,
      ranked_movie_ids: [202],
      updated_at: null,
    });
    const onSaved = vi.fn();
    const user = userEvent.setup();

    render(<RankedMoviePicker nextVote={nextVote} onSaved={onSaved} />);

    // Draft Beta as #1 pick
    await user.click(screen.getByRole("button", { name: /Beta/i }));

    // Submit the draft — button should be enabled now that rankedIds is non-empty
    await user.click(screen.getByRole("button", { name: /confirm draft/i }));

    // API should be called with just Beta
    await waitFor(() => {
      expect(submitNextMovieBallot).toHaveBeenCalledWith(8, [202]);
    });

    // Success overlay should appear
    expect(screen.getByTestId("draft-success")).toBeTruthy();

    // onSaved propagated via the overlay's immediate onDone call
    expect(onSaved).toHaveBeenCalled();
  });
});
