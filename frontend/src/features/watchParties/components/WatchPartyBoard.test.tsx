import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

import { WatchPartyBoard } from "./WatchPartyBoard";

vi.mock("axios");

let authUser: { id: number; username: string; is_admin: boolean } | null = {
  id: 1,
  username: "tester",
  is_admin: false,
};
const loginMock = vi.fn();

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: authUser,
    loading: false,
    login: loginMock,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const boardResponse = {
  drop: {
    id: 11,
    movie_title: "Current Feature",
    start_date: "2026-06-01",
    end_date: "2026-06-07",
  },
  available_discord_channels: [
    {
      key: "bynolo_public_one",
      label: "byNolo Public One",
      link_url: "https://discord.com/channels/public-one",
      description: "Open watch room one.",
    },
    {
      key: "bynolo_public_two",
      label: "byNolo Public Two",
      link_url: "https://discord.com/channels/public-two",
      description: "Open watch room two.",
    },
  ],
  parties: [
    {
      id: 9,
      weekly_drop_id: 11,
      title: "Friday Server Watch",
      host_mode: "bynolo_discord",
      status: "scheduled",
      scheduled_for: "2026-06-07T23:00:00Z",
      timezone_label: "America/Toronto",
      region: "Canada",
      platform: "Discord",
      capacity: null,
      notes: "Open watch room.",
      visibility_hint: "public",
      host_display_name: "tester",
      destination_label: "byNolo Public One",
      destination_url: "https://discord.com/channels/public-one",
      destination_description: "Open watch room one.",
      discord_channel_key: "bynolo_public_one",
      rsvp_count: 3,
      viewer_rsvp_status: null,
      can_edit: true,
      can_cancel: true,
      is_past: false,
    },
  ],
};

function renderBoard(props?: { compact?: boolean }) {
  return render(
    <MemoryRouter>
      <WatchPartyBoard {...props} />
    </MemoryRouter>,
  );
}

describe("WatchPartyBoard", () => {
  beforeEach(() => {
    authUser = { id: 1, username: "tester", is_admin: false };
    loginMock.mockReset();
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.post).mockReset();
    vi.mocked(axios.patch).mockReset();
    vi.mocked(axios.delete).mockReset();
  });

  it("shows a members-only message when signed out", () => {
    authUser = null;
    renderBoard();

    expect(screen.getByText("Watch parties are members-only in v1 so the board stays focused on the current crew and current drop.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Sign In to Browse Watch Parties/i }));
    expect(loginMock).toHaveBeenCalledTimes(1);
  });

  it("renders the compact upcoming preview", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: boardResponse });
    renderBoard({ compact: true });

    await waitFor(() => {
      expect(screen.getByText("Friday Server Watch")).toBeInTheDocument();
    });
    expect(screen.getByText("byNolo Discord")).toBeInTheDocument();
    expect(screen.queryByText("Host a Watch Party")).not.toBeInTheDocument();
  });

  it("allows RSVP from the compact home preview", async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: boardResponse })
      .mockResolvedValueOnce({
        data: {
          ...boardResponse,
          parties: [
            {
              ...boardResponse.parties[0],
              viewer_rsvp_status: "going",
              rsvp_count: 4,
            },
          ],
        },
      });
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        ...boardResponse.parties[0],
        viewer_rsvp_status: "going",
        rsvp_count: 4,
      },
    });

    renderBoard({ compact: true });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /RSVP Going/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /RSVP Going/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/watch-parties/9/rsvp",
        { status: "going" },
        expect.any(Object),
      );
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /You're Going/i })).toBeInTheDocument();
    });
  });

  it("shows host mode selection and custom link fields in the create flow", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: boardResponse });
    renderBoard();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Host a Watch Party/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Host a Watch Party/i }));

    expect(screen.getByLabelText("byNolo Discord Channel")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Host Mode"), {
      target: { value: "custom_link" },
    });

    expect(screen.getByLabelText("Custom Host Link")).toBeInTheDocument();
  });

  it("posts new parties to the canonical trailing-slash route", async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: { ...boardResponse, parties: [] } })
      .mockResolvedValueOnce({ data: boardResponse });
    vi.mocked(axios.post).mockResolvedValue({ data: boardResponse.parties[0] });
    renderBoard();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Host a Watch Party/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Host a Watch Party/i }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Friday Public Server Watch" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Watch Party/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/watch-parties/",
        expect.objectContaining({
          title: "Friday Public Server Watch",
          host_mode: "bynolo_discord",
          discord_channel_key: "bynolo_public_one",
        }),
        expect.any(Object),
      );
    });
  });

  it("updates RSVP state after a successful RSVP", async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: boardResponse })
      .mockResolvedValueOnce({
        data: {
          ...boardResponse,
          parties: [
            {
              ...boardResponse.parties[0],
              viewer_rsvp_status: "going",
              rsvp_count: 4,
            },
          ],
        },
      });
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        ...boardResponse.parties[0],
        viewer_rsvp_status: "going",
        rsvp_count: 4,
      },
    });

    renderBoard();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /RSVP Going/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /RSVP Going/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /You're Going/i })).toBeInTheDocument();
    });
  });
});
