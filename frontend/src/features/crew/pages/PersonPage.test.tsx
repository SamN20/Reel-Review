import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PersonPage from "./PersonPage";

vi.mock("axios");

vi.mock("../../../components/SiteHeader", () => ({
  SiteHeader: () => <div>Header</div>,
}));

vi.mock("../../../components/SiteFooter", () => ({
  SiteFooter: () => <div>Footer</div>,
}));

describe("PersonPage", () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  it("renders actor movies from the API", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        actor: { name: "Actor One", profile_path: "/actor.jpg" },
        movies: [{ id: 1, title: "Movie One", poster_path: null, drop_id: 10 }],
      },
    });

    render(
      <MemoryRouter initialEntries={["/actor/Actor%20One"]}>
        <Routes>
          <Route path="/actor/:name" element={<PersonPage type="actor" />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Actor One")).toBeInTheDocument();
    });

    expect(screen.getByText("1 associated movie")).toBeInTheDocument();
    expect(screen.getByText("Movie One")).toBeInTheDocument();
  });

  it("renders director movies from the API", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ id: 2, title: "Movie Two", poster_path: null, drop_id: 11 }],
    });

    render(
      <MemoryRouter initialEntries={["/director/Director%20Two"]}>
        <Routes>
          <Route path="/director/:name" element={<PersonPage type="director" />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Director Two")).toBeInTheDocument();
    });

    expect(screen.getByText("1 associated movie")).toBeInTheDocument();
    expect(screen.getByText("Movie Two")).toBeInTheDocument();
  });
});
