import { render, screen } from "@testing-library/react";
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

vi.mock("./features/results/pages/ResultsPage", () => ({
  default: () => <div>Results Page</div>,
}));

test("renders the home route", () => {
  render(<App />);
  expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
});
