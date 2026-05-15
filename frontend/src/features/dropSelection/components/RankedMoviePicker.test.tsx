import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach } from "vitest";
import { RankedMoviePicker } from "./RankedMoviePicker";
import { submitNextMovieBallot } from "../api";
import type { NextVote } from "../types";

vi.mock("../api", () => ({
  submitNextMovieBallot: vi.fn(),
}));

// Mock the success overlay so it immediately fires onDone instead of waiting 2.8 s.
vi.mock("./DraftSuccessOverlay", () => ({
  DraftSuccessOverlay: ({ onDone }: { onDone: () => void }) => {
    onDone();
    return null;
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

  it("submits the drafted ranking and triggers the success overlay", async () => {
    vi.mocked(submitNextMovieBallot).mockResolvedValue({
      target_drop_id: 8,
      ranked_movie_ids: [202, 101],
      updated_at: null,
    });
    const onSaved = vi.fn();
    const user = userEvent.setup();

    render(<RankedMoviePicker nextVote={nextVote} onSaved={onSaved} />);

    // Tap Beta first (becomes rank 1), then Alpha (rank 2)
    await user.click(screen.getByRole("button", { name: /Beta/i }));
    await user.click(screen.getByRole("button", { name: /Alpha/i }));

    // Submit the draft
    await user.click(screen.getByRole("button", { name: /confirm draft/i }));

    // API called with correct order
    expect(submitNextMovieBallot).toHaveBeenCalledWith(8, [202, 101]);
    // onSaved propagated from the mocked overlay's immediate onDone call
    expect(onSaved).toHaveBeenCalled();
  });
});
