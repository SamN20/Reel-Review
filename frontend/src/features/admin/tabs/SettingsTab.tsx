import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

type LeaderboardSettings = {
  categories_min_ratings: number;
  actors_min_ratings: number;
  directors_min_ratings: number;
  divisive_min_ratings: number;
};

export function SettingsTab() {
  const [settings, setSettings] = useState<LeaderboardSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/v1/admin/settings/leaderboards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/api/v1/admin/settings/leaderboards`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSettings(res.data);
      setSuccess("Settings saved.");
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to save settings");
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

      {settings && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Leaderboard Minimum Ratings</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Control how many ratings a movie needs to appear in each leaderboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Categories
              <input
                type="number"
                min={1}
                value={settings.categories_min_ratings}
                onChange={(e) => handleChange("categories_min_ratings", e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Actors
              <input
                type="number"
                min={1}
                value={settings.actors_min_ratings}
                onChange={(e) => handleChange("actors_min_ratings", e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Directors
              <input
                type="number"
                min={1}
                value={settings.directors_min_ratings}
                onChange={(e) => handleChange("directors_min_ratings", e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Most Divisive
              <input
                type="number"
                min={1}
                value={settings.divisive_min_ratings}
                onChange={(e) => handleChange("divisive_min_ratings", e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
              />
            </label>
          </div>

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
