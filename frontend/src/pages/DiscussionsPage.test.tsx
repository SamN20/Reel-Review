import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

import DiscussionsPage from "./DiscussionsPage";

vi.mock("axios");

vi.mock("../components/SiteHeader", () => ({
  SiteHeader: () => <div data-testid="site-header" />,
}));

vi.mock("../components/SiteFooter", () => ({
  SiteFooter: () => <div data-testid="site-footer" />,
}));

vi.mock("../components/NotificationBanner", () => ({
  NotificationBanner: () => null,
}));

let authUser: { id: number; username: string; is_admin: boolean } | null = {
  id: 1,
  username: "tester",
  is_admin: false,
};
const loginMock = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: authUser,
    loading: false,
    login: loginMock,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const review = {
  id: 1,
  user_name: "cinephile",
  overall_score: 90,
  review_text: "A sharp community take.",
  is_spoiler: false,
  like_count: 2,
  liked_by_me: false,
  reply_count: 0,
  created_at: "2026-05-04T12:00:00Z",
  score_delta: 0,
  controversy_score: 0,
  replies: [],
};

const spoilerReview = {
  ...review,
  id: 2,
  review_text: "The ending changes everything.",
  is_spoiler: true,
};

const currentDrop = {
  id: 11,
  movie: {
    id: 101,
    title: "Current Feature",
    overview: "The current weekly movie.",
    backdrop_path: "/current.jpg",
    poster_path: "/current-poster.jpg",
    release_date: "2026-01-01",
  },
  start_date: "2026-06-01",
  end_date: "2026-06-07",
  is_active: true,
};

const pastDrop = {
  id: 10,
  movie: {
    id: 100,
    title: "Past Feature",
    overview: "A past movie.",
    backdrop_path: "/past.jpg",
    poster_path: "/past-poster.jpg",
    release_date: "2025-01-01",
  },
  start_date: "2026-05-25",
  end_date: "2026-05-31",
  is_active: false,
  community_score: 88,
  user_has_rated: true,
};

function summaryFor(drop = currentDrop) {
  return {
    drop_id: drop.id,
    movie: {
      id: drop.movie.id,
      title: drop.movie.title,
      release_date: drop.movie.release_date,
      backdrop_path: drop.movie.backdrop_path,
      poster_path: drop.movie.poster_path,
      overview: drop.movie.overview,
      director_name: "Test Director",
      genres: [{ name: "Drama" }],
      watch_providers: [],
    },
    official_score: 90,
    user_score: null,
    total_votes: 4,
    comparison: null,
    standout_category: null,
    rankings: [],
    sub_categories: {},
    reviews: [review],
  };
}

function mockDiscussionRequests() {
  vi.mocked(axios.get).mockImplementation((url) => {
    const path = String(url);
    if (path.includes("/api/v1/drops/current")) {
      return Promise.resolve({ data: currentDrop });
    }
    if (path.includes("/api/v1/drops/past")) {
      return Promise.resolve({ data: [pastDrop] });
    }
    if (path.includes("/api/v1/results/10/reviews")) {
      return Promise.resolve({ data: { items: [review], total: 1, tab: "spoiler-free", sort: "top" } });
    }
    if (path.includes("/api/v1/results/11/reviews") && path.includes("tab=spoilers")) {
      return Promise.resolve({ data: { items: [spoilerReview], total: 1, tab: "spoilers", sort: "top" } });
    }
    if (path.includes("/api/v1/results/11/reviews")) {
      return Promise.resolve({ data: { items: [review], total: 1, tab: "spoiler-free", sort: "top" } });
    }
    if (path.includes("/api/v1/results/10")) {
      return Promise.resolve({ data: summaryFor(pastDrop) });
    }
    if (path.includes("/api/v1/results/11")) {
      return Promise.resolve({ data: summaryFor(currentDrop) });
    }
    return Promise.resolve({ data: {} });
  });
}

function renderPage(path = "/discussions") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/discussions" element={<DiscussionsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DiscussionsPage", () => {
  beforeEach(() => {
    authUser = { id: 1, username: "tester", is_admin: false };
    loginMock.mockClear();
    vi.mocked(axios.get).mockReset();
  });

  it("loads the current drop and spoiler-free community takes", async () => {
    mockDiscussionRequests();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Current Feature" })).toBeInTheDocument();
    });

    expect(screen.getByText("Recent Discussions")).toBeInTheDocument();
    expect(screen.getByText("Past Feature")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("A sharp community take.")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Spoiler-Free/i })).toBeInTheDocument();
  });

  it("opens spoiler query links on the spoiler tab without bypassing the gate", async () => {
    mockDiscussionRequests();
    renderPage("/discussions?tab=spoilers");

    await waitFor(() => {
      expect(screen.getByText("You are entering the Spoiler Zone")).toBeInTheDocument();
    });

    expect(screen.queryByText("The ending changes everything.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Acknowledge & Reveal Spoilers/i }));

    await waitFor(() => {
      expect(screen.getByText("The ending changes everything.")).toBeInTheDocument();
    });
  });

  it("loads a past discussion from the recent discussion rail", async () => {
    mockDiscussionRequests();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Current Feature" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Past Feature/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Past Feature" })).toBeInTheDocument();
    });
  });

  it("allows signed-out readers to view discussions", async () => {
    authUser = null;
    mockDiscussionRequests();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Current Feature" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("A sharp community take.")).toBeInTheDocument();
    });
  });
});
