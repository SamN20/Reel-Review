import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LeaderboardsPage from "./LeaderboardsPage";

vi.mock("axios");

vi.mock("../components/SiteHeader", () => ({
  SiteHeader: () => <div>Header</div>,
}));

vi.mock("../components/SiteFooter", () => ({
  SiteFooter: () => <div>Footer</div>,
}));

vi.mock("../features/leaderboards/components/UserCard", () => ({
  UserCard: ({ user }: { user: { username: string } }) => <div>UserCard {user.username}</div>,
}));

vi.mock("../features/leaderboards/components/CrewCard", () => ({
  CrewCard: ({ crew }: { crew: { name: string } }) => <div>CrewCard {crew.name}</div>,
}));

vi.mock("../features/leaderboards/components/DivisiveCard", () => ({
  DivisiveCard: ({ movie }: { movie: { title: string } }) => <div>DivisiveCard {movie.title}</div>,
}));

vi.mock("../features/leaderboards/components/CategoryMovieCard", () => ({
  CategoryMovieCard: ({ movie }: { movie: { title: string } }) => <div>CategoryCard {movie.title}</div>,
}));

vi.mock("../features/leaderboards/components/EmptyState", () => ({
  EmptyState: () => <div>EmptyState</div>,
}));

const users = [
  {
    id: 1,
    username: "alpha",
    display_name: null,
    use_display_name: true,
    public_profile: true,
    total_votes: 12,
  },
];

const directors = [
  {
    name: "Director One",
    average_score: 88.8,
    movie_count: 6,
  },
];

describe("LeaderboardsPage", () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  it("loads the user leaderboard on mount", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: users });

    render(
      <MemoryRouter>
        <LeaderboardsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("UserCard alpha")).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/api/v1/leaderboards/users"));
  });

  it("switches to directors and requests that leaderboard", async () => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (String(url).includes("/leaderboards/directors")) {
        return Promise.resolve({ data: directors });
      }
      return Promise.resolve({ data: users });
    });

    render(
      <MemoryRouter>
        <LeaderboardsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("UserCard alpha")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Top Directors/i }));

    await waitFor(() => {
      expect(screen.getByText("CrewCard Director One")).toBeInTheDocument();
    });
  });
});
