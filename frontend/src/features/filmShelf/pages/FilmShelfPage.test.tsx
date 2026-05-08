import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FilmShelfPage from "./FilmShelfPage";
import type { ArchiveShelvesResponse } from "../api";

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, username: "tester", is_admin: false },
    loading: false,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return {
    ...actual,
    fetchArchiveShelves: vi.fn(),
  };
});

const { fetchArchiveShelves } = await import("../api");

const archiveResponse: ArchiveShelvesResponse = {
  shelves: [
    {
      id: "missed-by-you",
      title: "Missed By You",
      description: "Past drops still waiting for your score.",
      kind: "missed",
      total_count: 1,
      view_all_path: null,
      items: [
        {
          drop_id: 7,
          movie: {
            id: 3,
            title: "Missed Movie",
            release_date: "2024-01-01",
            overview: "A missed movie.",
            poster_path: null,
            backdrop_path: "/missed.jpg",
            trailer_youtube_key: "missedTrailer",
            director_name: "Director",
            genres: [{ name: "Drama" }],
            watch_providers: [],
          },
          start_date: "2026-04-20",
          end_date: "2026-04-26",
          community_score: 88,
          total_votes: 10,
          user_has_rated: false,
          user_score: null,
          rank: null,
          divisiveness: null,
        },
      ],
    },
    {
      id: "top-rated-overall",
      title: "Top Rated Overall",
      description: "The community favorites.",
      kind: "top_rated",
      total_count: 1,
      view_all_path: null,
      items: [
        {
          drop_id: 8,
          movie: {
            id: 4,
            title: "Rated Movie",
            release_date: "2023-01-01",
            overview: "A rated movie.",
            poster_path: null,
            backdrop_path: "/rated.jpg",
            trailer_youtube_key: null,
            director_name: "Director",
            genres: [{ name: "Sci-Fi" }],
            watch_providers: [],
          },
          start_date: "2026-04-27",
          end_date: "2026-05-03",
          community_score: 92,
          total_votes: 12,
          user_has_rated: true,
          user_score: 100,
          rank: 1,
          divisiveness: null,
        },
      ],
    },
  ],
};

describe("FilmShelfPage", () => {
  beforeEach(() => {
    vi.mocked(fetchArchiveShelves).mockReset();
    vi.useRealTimers();
  });

  it("renders page chrome immediately and delays shelf skeletons while archive data is pending", async () => {
    vi.mocked(fetchArchiveShelves).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/film-shelf"]}>
        <Routes>
          <Route path="/film-shelf" element={<FilmShelfPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "The Film Shelf" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading Film Shelf shelves" })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("status", { name: "Loading Film Shelf shelves" })).toBeInTheDocument();
    });
    expect(screen.getAllByTestId("film-shelf-skeleton-row")).toHaveLength(4);
    expect(screen.queryByText("Opening the Film Shelf...")).not.toBeInTheDocument();
  });

  it("renders dynamic shelves with missed and rated states", async () => {
    vi.mocked(fetchArchiveShelves).mockResolvedValue(archiveResponse);

    render(
      <MemoryRouter initialEntries={["/film-shelf"]}>
        <Routes>
          <Route path="/film-shelf" element={<FilmShelfPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "The Film Shelf" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading Film Shelf shelves" })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Missed By You")).toBeInTheDocument();
    });

    expect(screen.queryByRole("status", { name: "Loading Film Shelf shelves" })).not.toBeInTheDocument();
    expect(screen.getByText("Browse past drops, catch up on movies you missed, and revisit how the community scored each week.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText("Missed Movie").length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.getByText("Open for votes")).toBeInTheDocument();
    });
    expect(screen.getByText("Top Rated Overall")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText("Rated Movie").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Rated")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders the error state after archive loading fails", async () => {
    vi.mocked(fetchArchiveShelves).mockRejectedValue(new Error("No shelf for you"));

    render(
      <MemoryRouter initialEntries={["/film-shelf"]}>
        <Routes>
          <Route path="/film-shelf" element={<FilmShelfPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "The Film Shelf" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("The Film Shelf could not be loaded.")).toBeInTheDocument();
    });

    expect(screen.queryByRole("status", { name: "Loading Film Shelf shelves" })).not.toBeInTheDocument();
  });
});
