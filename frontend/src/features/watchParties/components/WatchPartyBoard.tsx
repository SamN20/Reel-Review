import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ExternalLink, Loader2, Lock, Pencil, Plus, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import {
  cancelWatchParty,
  createWatchParty,
  fetchCurrentWatchPartyBoard,
  updateWatchParty,
  updateWatchPartyRsvp,
  type WatchParty,
  type WatchPartyBoard as WatchPartyBoardData,
  type WatchPartyHostMode,
} from "../api";

interface WatchPartyBoardProps {
  compact?: boolean;
}

interface FormState {
  title: string;
  host_mode: WatchPartyHostMode;
  discord_channel_key: string;
  external_url: string;
  scheduled_for: string;
  timezone_label: string;
  region: string;
  platform: string;
  capacity: string;
  notes: string;
  visibility_hint: string;
}

const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Toronto";

function defaultScheduledFor() {
  const next = new Date(Date.now() + 60 * 60 * 1000);
  return next.toISOString().slice(0, 16);
}

function buildInitialForm(): FormState {
  return {
    title: "",
    host_mode: "bynolo_discord",
    discord_channel_key: "",
    external_url: "",
    scheduled_for: defaultScheduledFor(),
    timezone_label: DEFAULT_TIMEZONE,
    region: "",
    platform: "",
    capacity: "",
    notes: "",
    visibility_hint: "public",
  };
}

function formatPartyTime(isoValue: string, timezoneLabel: string) {
  const date = new Date(isoValue);
  return `${date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} (${timezoneLabel})`;
}

function toInputDateTime(isoValue: string) {
  const date = new Date(isoValue);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function buildPayload(form: FormState) {
  return {
    title: form.title.trim(),
    host_mode: form.host_mode,
    discord_channel_key: form.host_mode === "bynolo_discord" ? form.discord_channel_key || null : null,
    external_url: form.host_mode === "custom_link" ? form.external_url.trim() || null : null,
    scheduled_for: new Date(form.scheduled_for).toISOString(),
    timezone_label: form.timezone_label.trim(),
    region: form.region.trim() || null,
    platform: form.platform.trim() || null,
    capacity: form.capacity ? Number(form.capacity) : null,
    notes: form.notes.trim() || null,
    visibility_hint: form.visibility_hint || null,
  };
}

function partyToForm(party: WatchParty): FormState {
  return {
    title: party.title,
    host_mode: party.host_mode,
    discord_channel_key: party.discord_channel_key || "",
    external_url: party.destination_url || "",
    scheduled_for: toInputDateTime(party.scheduled_for),
    timezone_label: party.timezone_label,
    region: party.region || "",
    platform: party.platform || "",
    capacity: party.capacity ? String(party.capacity) : "",
    notes: party.notes || "",
    visibility_hint: party.visibility_hint || "public",
  };
}

function WatchPartyCard({
  party,
  compact,
  onEdit,
  onCancel,
  onRsvp,
  savingAction,
}: {
  party: WatchParty;
  compact: boolean;
  onEdit: (party: WatchParty) => void;
  onCancel: (party: WatchParty) => void;
  onRsvp: (party: WatchParty, status: "going" | "not_going") => void;
  savingAction: string | null;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-bold text-white">{party.title}</h4>
            {party.host_mode === "bynolo_discord" ? (
              <span className="rounded-full border border-blue-500/30 bg-blue-950/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-blue-300">
                byNolo Discord
              </span>
            ) : (
              <span className="rounded-full border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                Custom Link
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-400">Hosted by {party.host_display_name}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
            <Users className="h-3.5 w-3.5" />
            {party.rsvp_count}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-zinc-300">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-zinc-500" />
          {formatPartyTime(party.scheduled_for, party.timezone_label)}
        </div>
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-zinc-500" />
          <a href={party.destination_url} target="_blank" rel="noreferrer" className="truncate text-red-300 hover:text-red-200">
            {party.destination_label}
          </a>
        </div>
        {party.destination_description ? (
          <p className="text-xs text-zinc-500">{party.destination_description}</p>
        ) : null}
        {party.notes ? <p className="pt-1 text-sm leading-6 text-zinc-300">{party.notes}</p> : null}
      </div>

      <div className={`mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-800/70 pt-4 ${compact ? "text-xs" : ""}`}>
        <button
          type="button"
          onClick={() => onRsvp(party, "going")}
          disabled={savingAction === `rsvp-${party.id}`}
          className={`rounded-lg font-semibold transition-colors ${compact ? "flex-1 px-3 py-2 text-xs" : "px-3 py-2 text-sm"} ${
            party.viewer_rsvp_status === "going"
              ? "bg-red-600 text-white"
              : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          }`}
        >
          {party.viewer_rsvp_status === "going" ? "You're Going" : "RSVP Going"}
        </button>
        <button
          type="button"
          onClick={() => onRsvp(party, "not_going")}
          disabled={savingAction === `rsvp-${party.id}`}
          className={`rounded-lg font-semibold transition-colors ${compact ? "flex-1 px-3 py-2 text-xs" : "px-3 py-2 text-sm"} ${
            party.viewer_rsvp_status === "not_going"
              ? "bg-zinc-700 text-white"
              : "border border-zinc-700 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Not Going
        </button>
        {!compact ? (
          <>
          {party.can_edit ? (
            <button
              type="button"
              onClick={() => onEdit(party)}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          ) : null}
          {party.can_cancel ? (
            <button
              type="button"
              onClick={() => onCancel(party)}
              disabled={savingAction === `cancel-${party.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-red-900/70 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-950/30"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function WatchPartyBoard({ compact = false }: WatchPartyBoardProps) {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [board, setBoard] = useState<WatchPartyBoardData | null>(null);
  const [loading, setLoading] = useState(!compact);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(buildInitialForm());
  const [editingPartyId, setEditingPartyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    if (!user) return;
    if (!compact) setLoading(true);
    try {
      const response = await fetchCurrentWatchPartyBoard();
      setBoard(response);
      setError("");
      setForm((current) =>
        current.discord_channel_key || !response.available_discord_channels[0]?.key
          ? current
          : {
              ...current,
              discord_channel_key: response.available_discord_channels[0].key,
            },
      );
    } catch (err) {
      console.error("Failed to load watch parties", err);
      setError("Watch parties could not be loaded right now.");
    } finally {
      setLoading(false);
    }
  }, [compact, user]);

  useEffect(() => {
    if (!user) return;
    // Data hydrate is intentionally kicked off from this effect when auth becomes available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBoard();
  }, [loadBoard, user]);

  const visibleParties = compact ? board?.parties.filter((party) => !party.is_past).slice(0, 3) ?? [] : board?.parties ?? [];
  const upcomingParties = visibleParties.filter((party) => !party.is_past);
  const pastParties = compact ? [] : visibleParties.filter((party) => party.is_past);

  const openCreateForm = () => {
    if (compact) {
      navigate("/community#watch-parties");
      return;
    }
    setEditingPartyId(null);
    setForm((current) => ({
      ...buildInitialForm(),
      discord_channel_key: board?.available_discord_channels[0]?.key || current.discord_channel_key,
    }));
    setFormOpen(true);
  };

  const openEditForm = (party: WatchParty) => {
    setEditingPartyId(party.id);
    setForm(partyToForm(party));
    setFormOpen(true);
  };

  const submitForm = async () => {
    if (!user) {
      login();
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (editingPartyId) {
        await updateWatchParty(editingPartyId, payload);
      } else {
        await createWatchParty(payload);
      }
      setFormOpen(false);
      setEditingPartyId(null);
      setForm(buildInitialForm());
      await loadBoard();
    } catch (err) {
      console.error("Failed to save watch party", err);
      setError("Watch party could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleRsvp = async (party: WatchParty, status: "going" | "not_going") => {
    setSavingAction(`rsvp-${party.id}`);
    try {
      await updateWatchPartyRsvp(party.id, status);
      await loadBoard();
    } catch (err) {
      console.error("Failed to update RSVP", err);
      setError("RSVP could not be updated.");
    } finally {
      setSavingAction(null);
    }
  };

  const handleCancel = async (party: WatchParty) => {
    setSavingAction(`cancel-${party.id}`);
    try {
      await cancelWatchParty(party.id);
      await loadBoard();
    } catch (err) {
      console.error("Failed to cancel watch party", err);
      setError("Watch party could not be cancelled.");
    } finally {
      setSavingAction(null);
    }
  };

  if (!user) {
    return compact ? (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-500">
        Sign in to see member watch parties.
      </div>
    ) : (
      <div id="watch-parties" className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <Lock className="h-5 w-5 text-zinc-400" />
          Watch Parties
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Watch parties are members-only in v1 so the board stays focused on the current crew and current drop.
        </p>
        <button
          type="button"
          onClick={login}
          className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          Sign In to Browse Watch Parties
        </button>
      </div>
    );
  }

  if (loading && !board) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div id={compact ? undefined : "watch-parties"} className={compact ? "space-y-3" : "space-y-6"}>
      {!compact ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-white">Watch Parties</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Host this week&apos;s movie in byNolo Discord or post a custom destination for your group.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            <Plus className="h-4 w-4" />
            Host a Watch Party
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!compact && formOpen ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-bold text-white">{editingPartyId ? "Edit Watch Party" : "Host a Watch Party"}</h4>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingPartyId(null);
              }}
              className="text-zinc-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Title
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
                placeholder="Sunday night group watch"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Host Mode
              <select
                value={form.host_mode}
                onChange={(event) => setForm({ ...form, host_mode: event.target.value as WatchPartyHostMode })}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
              >
                <option value="bynolo_discord">byNolo Discord</option>
                <option value="custom_link">Custom Link</option>
              </select>
            </label>

            {form.host_mode === "bynolo_discord" ? (
              <label className="flex flex-col gap-2 text-sm text-zinc-300 md:col-span-2">
                byNolo Discord Channel
                <select
                  value={form.discord_channel_key}
                  onChange={(event) => setForm({ ...form, discord_channel_key: event.target.value })}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
                >
                  {board?.available_discord_channels.map((channel) => (
                    <option key={channel.key} value={channel.key}>
                      {channel.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="flex flex-col gap-2 text-sm text-zinc-300 md:col-span-2">
                Custom Host Link
                <input
                  value={form.external_url}
                  onChange={(event) => setForm({ ...form, external_url: event.target.value })}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
                  placeholder="https://discord.gg/... or https://teleparty.com/..."
                />
              </label>
            )}

            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Scheduled For
              <input
                type="datetime-local"
                value={form.scheduled_for}
                onChange={(event) => setForm({ ...form, scheduled_for: event.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Timezone Label
              <input
                value={form.timezone_label}
                onChange={(event) => setForm({ ...form, timezone_label: event.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Platform
              <input
                value={form.platform}
                onChange={(event) => setForm({ ...form, platform: event.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
                placeholder="Discord, Teleparty, Zoom, In Person"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Region or Locale
              <input
                value={form.region}
                onChange={(event) => setForm({ ...form, region: event.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
                placeholder="Toronto, Eastern Time, Canada"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Capacity
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
                placeholder="Optional"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Visibility Hint
              <select
                value={form.visibility_hint}
                onChange={(event) => setForm({ ...form, visibility_hint: event.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
              >
                <option value="public">Public watch party</option>
                <option value="private_group">Private group</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-zinc-300 md:col-span-2">
              Notes
              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
                placeholder="Add any context for the group, whether the stream starts exactly on time, or what people should bring."
              />
            </label>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => void submitForm()}
              disabled={saving}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : editingPartyId ? "Save Changes" : "Create Watch Party"}
            </button>
          </div>
        </div>
      ) : null}

      {compact ? (
        <>
          {upcomingParties.length > 0 ? (
            upcomingParties.map((party) => (
              <WatchPartyCard
                key={party.id}
                party={party}
                compact
                onEdit={openEditForm}
                onCancel={handleCancel}
                onRsvp={handleRsvp}
                savingAction={savingAction}
              />
            ))
          ) : (
            <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex items-center justify-center text-zinc-500 text-sm">
              No watch parties scheduled for this drop yet.
            </div>
          )}

          <button
            type="button"
            onClick={openCreateForm}
            className="w-full p-4 border border-dashed border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm"
          >
            + Host a Watch Party
          </button>
        </>
      ) : (
        <>
          {upcomingParties.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">Upcoming Parties</h4>
              {upcomingParties.map((party) => (
                <WatchPartyCard
                  key={party.id}
                  party={party}
                  compact={false}
                  onEdit={openEditForm}
                  onCancel={handleCancel}
                  onRsvp={handleRsvp}
                  savingAction={savingAction}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/25 p-6 text-sm text-zinc-500">
              No watch parties are up yet for {board?.drop.movie_title ?? "this week's drop"}. Be the first to put something on the board.
            </div>
          )}

          {pastParties.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">Past Parties</h4>
              {pastParties.map((party) => (
                <WatchPartyCard
                  key={party.id}
                  party={party}
                  compact={false}
                  onEdit={openEditForm}
                  onCancel={handleCancel}
                  onRsvp={handleRsvp}
                  savingAction={savingAction}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
