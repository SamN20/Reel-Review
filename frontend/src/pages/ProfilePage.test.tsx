import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "./ProfilePage";

vi.mock("axios");

const mockUseAuth = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../components/SiteHeader", () => ({
  SiteHeader: () => <div>Header</div>,
}));

vi.mock("../components/SiteFooter", () => ({
  SiteFooter: () => <div>Footer</div>,
}));

const profileResponse = {
  id: 9,
  username: "jane",
  display_name: "Jane Doe",
  use_display_name: true,
  total_votes: 4,
  average_score: 87.5,
  recent_ratings: [],
  favorite_movies: [],
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.put).mockReset();
    localStorage.setItem("token", "test-token");
  });

  it("loads a public profile without settings", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      updateUser: vi.fn(),
    });

    vi.mocked(axios.get).mockResolvedValue({ data: profileResponse });

    render(
      <MemoryRouter initialEntries={["/p/jane"]}>
        <Routes>
          <Route path="/p/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Privacy Settings/i)).not.toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/api/v1/users/by-username/jane/profile"), expect.any(Object));
  });

  it("updates preferences from the private profile view", async () => {
    const updateUser = vi.fn();
    mockUseAuth.mockReturnValue({
      user: {
        id: 5,
        username: "me",
        display_name: "Me",
        use_display_name: true,
        show_on_leaderboard: true,
        public_profile: false,
      },
      loading: false,
      updateUser,
    });

    vi.mocked(axios.get).mockResolvedValue({ data: { ...profileResponse, username: "me" } });
    vi.mocked(axios.put).mockResolvedValue({ data: {} });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Privacy Settings/i }));

    await userEvent.click(screen.getByRole("button", { name: /Save Preferences/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/users/me/preferences"),
        {
          use_display_name: true,
          show_on_leaderboard: true,
          public_profile: false,
        },
        expect.any(Object),
      );
    });

    expect(updateUser).toHaveBeenCalledWith({
      use_display_name: true,
      show_on_leaderboard: true,
      public_profile: false,
    });
  });
});
