import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import App from "./App";

vi.mock("./context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./pages/Home", () => ({
  default: () => <div>Home Page</div>,
}));

vi.mock("./pages/AuthCallback", () => ({
  default: () => <div>Auth Callback</div>,
}));

vi.mock("./pages/Vote", () => ({
  default: () => <div>Vote Page</div>,
}));

vi.mock("./pages/Admin", () => ({
  default: () => <div>Admin Page</div>,
}));

vi.mock("./pages/FilmShelfPage", () => ({
  default: () => <div>Film Shelf Page</div>,
}));

vi.mock("./pages/LeaderboardsPage", () => ({
  default: () => <div>Leaderboards Page</div>,
}));

vi.mock("./pages/DiscussionsPage", () => ({
  default: () => <div>Community Page</div>,
}));

vi.mock("./features/results/pages/ResultsPage", () => ({
  default: () => <div>Results Page</div>,
}));

vi.mock("./features/roadmap/pages/RoadmapPage", () => ({
  default: () => <div>Roadmap Page</div>,
}));

test("renders the home route", () => {
  window.history.pushState({}, "", "/");
  render(<App />);
  expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
});

test("redirects legacy discussions links to community", async () => {
  window.history.pushState({}, "", "/discussions?tab=spoilers#watch-parties");
  render(<App />);

  expect(screen.getByText(/Community Page/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(window.location.pathname).toBe("/community");
  });
  expect(window.location.search).toBe("?tab=spoilers");
  expect(window.location.hash).toBe("#watch-parties");
});
