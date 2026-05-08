import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MovieAnalyticsView } from "./MovieAnalyticsView";
import { MoviesTab } from "./MoviesTab";

vi.mock("axios");

vi.mock("recharts", () => ({
  Bar: () => null,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Legend: () => null,
  PolarAngleAxis: () => null,
  PolarGrid: () => null,
  PolarRadiusAxis: () => null,
  Radar: () => null,
  RadarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const movies = [
  {
    id: 7,
    title: "Analytics Movie",
    release_date: "2024-01-05",
    poster_path: null,
    in_pool: false,
    genres: [{ id: 18, name: "Drama" }],
    average_score: 92,
    total_ratings: 1,
  },
  {
    id: 8,
    title: "Other Movie",
    release_date: "2020-01-05",
    poster_path: null,
    in_pool: false,
    genres: [{ id: 35, name: "Comedy" }],
    average_score: 45,
    total_ratings: 1,
  },
];

const analyticsResponse = {
  movie: {
    id: 7,
    title: "Analytics Movie",
    tmdb_id: 123,
    release_date: "2024-01-05",
    overview: "A movie with a lot of measurable opinions.",
    director_name: "Sample Director",
    poster_path: null,
    backdrop_path: null,
    genres: [{ id: 18, name: "Drama" }],
  },
  stats: {
    total_ratings: 1,
    average_score: 92,
    highest_score: 92,
    lowest_score: 92,
    median_score: 92,
    score_spread: 0,
    spoiler_review_count: 1,
    text_review_count: 1,
  },
  score_distribution: [{ score: 90, count: 1 }],
  subcategories: [
    { key: "story", subject: "Story & Pacing", count: 1, average_score: 90 },
  ],
  ratings: [
    {
      id: 44,
      user_id: 12,
      username: "real-reviewer",
      is_anonymous: true,
      overall_score: 92,
      review_text: "Loved the ending.",
      has_spoilers: true,
      is_late: false,
      weekly_drop_id: 5,
      weekly_drop_start_date: "2026-04-20",
      weekly_drop_end_date: "2026-04-26",
      created_at: "2026-04-27T10:00:00Z",
      subcategories: {
        story: 90,
        performances: null,
        visuals: null,
        sound: null,
        rewatchability: null,
        enjoyment: null,
        emotional_impact: null,
      },
    },
  ],
};

const emptyAnalyticsResponse = {
  ...analyticsResponse,
  stats: {
    total_ratings: 0,
    average_score: null,
    highest_score: null,
    lowest_score: null,
    median_score: null,
    score_spread: 0,
    spoiler_review_count: 0,
    text_review_count: 0,
  },
  score_distribution: [],
  subcategories: [],
  ratings: [],
};

describe("MoviesTab analytics", () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
    localStorage.setItem("token", "test-token");
  });

  it("opens a movie analytics detail view and returns to the board", async () => {
    vi.mocked(axios.get).mockImplementation((url) => {
      const path = String(url);
      if (path.includes("/api/v1/admin/movies/7/analytics")) {
        return Promise.resolve({ data: analyticsResponse });
      }
      if (path.includes("/api/v1/admin/movies")) {
        return Promise.resolve({ data: movies });
      }
      if (path.includes("/api/v1/admin/drops")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error(`Unexpected URL: ${path}`));
    });

    render(<MoviesTab />);

    await waitFor(() => {
      expect(screen.getByText("Analytics Movie")).toBeInTheDocument();
    });
    expect(screen.getByText("Other Movie")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Filters/i }));
    await userEvent.selectOptions(screen.getByLabelText("Genre"), "Drama");

    expect(screen.queryByText("Other Movie")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Analytics Movie"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Analytics Movie" })).toBeInTheDocument();
    });

    expect(screen.getByText("real-reviewer")).toBeInTheDocument();
    expect(screen.getByText("Loved the ending.")).toBeInTheDocument();
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(screen.getByText("Spoiler")).toBeInTheDocument();
    expect(screen.getAllByText("92").length).toBeGreaterThan(0);

    await userEvent.type(screen.getByPlaceholderText("Search reviews or users..."), "no-match");
    expect(screen.getByText("No reviews match the current filters.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Back to Movies/i }));

    expect(screen.getByText("Movie Database")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filter movies...")).toBeInTheDocument();
  });

  it("shows the unrated movie empty state", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: emptyAnalyticsResponse });

    render(<MovieAnalyticsView movieId={7} onBack={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Analytics Movie" })).toBeInTheDocument();
    });

    expect(screen.getByText("No approved visible ratings yet.")).toBeInTheDocument();
    expect(screen.getByText("No approved visible ratings yet for this movie.")).toBeInTheDocument();
  });
});
