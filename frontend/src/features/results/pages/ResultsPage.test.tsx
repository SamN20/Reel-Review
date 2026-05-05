import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

import ResultsPage from "./ResultsPage";
import type { ResultsSummary } from "../api";

vi.mock("axios");

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, username: "tester", is_admin: false },
    loading: false,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockReview = {
  id: 1,
  user_name: "test_user",
  overall_score: 95,
  review_text: "Loved it!",
  is_spoiler: false,
  like_count: 4,
  liked_by_me: false,
  reply_count: 0,
  created_at: "2026-05-04T12:00:00Z",
  score_delta: 5,
  controversy_score: 5,
  replies: [],
};

const mockResultsData: ResultsSummary = {
  drop_id: 13,
  movie: {
    id: 1,
    title: "Test Movie",
    release_date: "2024-01-01",
    backdrop_path: "/path.jpg",
    poster_path: "/poster.jpg",
    overview: "A beautiful test movie.",
    director_name: "Test Director",
    genres: [{ name: "Science Fiction" }],
    watch_providers: [{ provider_id: 1, provider_name: "Crave", logo_path: null, category: "flatrate", region: "CA", link_url: "https://www.justwatch.com/ca/movie/test-movie" }],
  },
  official_score: 90,
  user_score: null,
  total_votes: 10,
  comparison: null,
  standout_category: { key: "performances", label: "Performances", score: 95 },
  rankings: [
    {
      id: "overall",
      label: "All-Time Ranking",
      rank: 1,
      total_ranked: 4,
      badge: "Top 4",
      surrounding: [{ rank: 1, title: "Test Movie", score: 90, is_current: true }],
    },
  ],
  sub_categories: {
    story: 85,
    performances: 95,
  },
  reviews: [mockReview],
};

const mockReviewList = {
  items: [mockReview],
  total: 1,
  tab: "spoiler-free",
  sort: "top",
};

function mockResultsRequests(summary = mockResultsData, reviews = mockReviewList) {
  vi.mocked(axios.get).mockImplementation((url) => {
    if (typeof url === "string" && url.includes("/reviews")) {
      return Promise.resolve({ data: reviews });
    }
    return Promise.resolve({ data: summary });
  });
}

describe("ResultsPage", () => {
  it("renders loading state initially", () => {
    vi.mocked(axios.get).mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={["/results/13"]}>
        <Routes>
          <Route path="/results/:id" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it("renders results and Rate Now button when user has not voted", async () => {
    mockResultsRequests();

    render(
      <MemoryRouter initialEntries={["/results/13"]}>
        <Routes>
          <Route path="/results/:id" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Test Movie").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Test Director")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rate This Movie/i })).toBeInTheDocument();
    expect(screen.getByText("Loved it!")).toBeInTheDocument();
    expect(screen.getByText("Crave")).toBeInTheDocument();
  });

  it("renders user score when user has voted", async () => {
    const votedData: ResultsSummary = {
      ...mockResultsData,
      user_score: 85,
      comparison: {
        delta: -5,
        absolute_delta: 5,
        direction: "lower",
      },
    };
    mockResultsRequests(votedData);

    render(
      <MemoryRouter initialEntries={["/results/13"]}>
        <Routes>
          <Route path="/results/:id" element={<ResultsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Your Vote")).toBeInTheDocument();
    });

    expect(screen.getAllByText("85").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Rate This Movie/i })).not.toBeInTheDocument();
  });
});
