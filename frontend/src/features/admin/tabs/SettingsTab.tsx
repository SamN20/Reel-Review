import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

type LeaderboardSettings = {
  categories_min_ratings: number;
  actors_min_ratings: number;
  directors_min_ratings: number;
  divisive_min_ratings: number;
};

type DropSelectionSettings = {
  user_vote_total_options: number;
  user_vote_smart_options: number;
  user_vote_wildcard_options: number;
};

type OnboardingSettings = {
  always_play: boolean;
};

type NumberFieldProps = {
  label: string;
  value: number;
  min?: number;
  onChange: (value: string) => void;
};

function NumberField({ label, value, min = 0, onChange }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-zinc-300">
      {label}
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
      />
    </label>
  );
}

type ToggleFieldProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleField({ label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-sm font-semibold text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500
          ${checked ? "bg-red-600" : "bg-zinc-700"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200
            ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function SettingsTab() {
  const [settings, setSettings] = useState<LeaderboardSettings | null>(null);
  const [dropSettings, setDropSettings] = useState<DropSelectionSettings | null>(null);
  const [onboardingSettings, setOnboardingSettings] = useState<OnboardingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [res, dropRes, onboardingRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/admin/settings/leaderboards`, { headers }),
        axios.get(`${API_URL}/api/v1/admin/settings/drop-selection`, { headers }),
        axios.get(`${API_URL}/api/v1/admin/settings/onboarding`, { headers }),
      ]);
      setSettings(res.data);
      setDropSettings(dropRes.data);
      setOnboardingSettings(onboardingRes.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, "Failed to load settings"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Settings hydrate once on mount from the admin API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
  }, []);

  const handleChange = (key: keyof LeaderboardSettings, value: string) => {
    if (!settings) return;
    const next = Number(value);
    setSettings({
      ...settings,
      [key]: Number.isNaN(next) ? 0 : next,
    });
  };

  const handleDropChange = (key: keyof DropSelectionSettings, value: string) => {
    if (!dropSettings) return;
    const next = Number(value);
    setDropSettings({
      ...dropSettings,
      [key]: Number.isNaN(next) ? 0 : next,
    });
  };

  const handleSave = async () => {
    if (!settings || !dropSettings || !onboardingSettings) return;
    setSaving(true);
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [res, dropRes, onboardingRes] = await Promise.all([
        axios.put(`${API_URL}/api/v1/admin/settings/leaderboards`, settings, { headers }),
        axios.put(`${API_URL}/api/v1/admin/settings/drop-selection`, dropSettings, { headers }),
        axios.put(`${API_URL}/api/v1/admin/settings/onboarding`, onboardingSettings, { headers }),
      ]);
      setSettings(res.data);
      setDropSettings(dropRes.data);
      setOnboardingSettings(onboardingRes.data);
      setSuccess("Settings saved.");
      setError("");
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-400">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Site Settings</h2>
      </div>

      {error && (
        <div className="text-red-500 bg-red-950/20 p-4 rounded-lg border border-red-900/50">
          {error}
        </div>
      )}

      {success && (
        <div className="text-emerald-400 bg-emerald-950/20 p-4 rounded-lg border border-emerald-900/50">
          {success}
        </div>
      )}

      {settings && dropSettings && onboardingSettings && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Leaderboard Minimum Ratings</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Control how many ratings a movie needs to appear in each leaderboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="Categories" min={1} value={settings.categories_min_ratings} onChange={(value) => handleChange("categories_min_ratings", value)} />
            <NumberField label="Actors" min={1} value={settings.actors_min_ratings} onChange={(value) => handleChange("actors_min_ratings", value)} />
            <NumberField label="Directors" min={1} value={settings.directors_min_ratings} onChange={(value) => handleChange("directors_min_ratings", value)} />
            <NumberField label="Most Divisive" min={1} value={settings.divisive_min_ratings} onChange={(value) => handleChange("divisive_min_ratings", value)} />
          </div>

          <div className="h-px bg-zinc-800" />

          <div>
            <h3 className="text-lg font-semibold">User Vote Shortlist</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Tune how many pool movies appear when the community ranks next week's options.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NumberField label="Total Options" min={1} value={dropSettings.user_vote_total_options} onChange={(value) => handleDropChange("user_vote_total_options", value)} />
            <NumberField label="Smart Picks" min={0} value={dropSettings.user_vote_smart_options} onChange={(value) => handleDropChange("user_vote_smart_options", value)} />
            <NumberField label="Wildcards" min={0} value={dropSettings.user_vote_wildcard_options} onChange={(value) => handleDropChange("user_vote_wildcard_options", value)} />
          </div>

          {dropSettings.user_vote_smart_options + dropSettings.user_vote_wildcard_options !== dropSettings.user_vote_total_options && (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-sm font-semibold text-amber-300">
              Smart picks and wildcards must add up to the total options.
            </div>
          )}

          <div className="h-px bg-zinc-800" />

          {/* ── Onboarding ────────────────────────────────────────── */}
          <div>
            <h3 className="text-lg font-semibold">Onboarding Animations</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Controls when the "how it works" intro screens appear for voting and draft ranking.
            </p>
          </div>

          <ToggleField
            label="Always play onboarding"
            description="When on, every user sees the intro screens every time they vote or rank — useful for testing. When off, intros only show on each user's first time."
            checked={onboardingSettings.always_play}
            onChange={(v) => setOnboardingSettings({ always_play: v })}
          />

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-white text-zinc-950 font-semibold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
