interface PrivacySettingsPanelProps {
  useDisplayName: boolean;
  showOnLeaderboard: boolean;
  publicProfile: boolean;
  savingSettings: boolean;
  onUseDisplayNameChange: (value: boolean) => void;
  onShowOnLeaderboardChange: (value: boolean) => void;
  onPublicProfileChange: (value: boolean) => void;
  onSave: () => void;
}

export function PrivacySettingsPanel({
  useDisplayName,
  showOnLeaderboard,
  publicProfile,
  savingSettings,
  onUseDisplayNameChange,
  onShowOnLeaderboardChange,
  onPublicProfileChange,
  onSave,
}: PrivacySettingsPanelProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-6">Profile Settings</h2>

      <div className="space-y-6">
        <ToggleRow
          title="Use Display Name"
          description="Show your KeyN display name instead of username."
          checked={useDisplayName}
          onChange={onUseDisplayNameChange}
        />
        <ToggleRow
          title="Show on Leaderboards"
          description="Allow your account to appear in public rankings."
          checked={showOnLeaderboard}
          onChange={onShowOnLeaderboardChange}
        />
        <ToggleRow
          title="Public Profile"
          description="Allow other users to view your profile and ratings."
          checked={publicProfile}
          onChange={onPublicProfileChange}
        />
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-800">
        <button
          onClick={onSave}
          disabled={savingSettings}
          className="bg-white text-zinc-950 font-bold px-6 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {savingSettings ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
      </label>
    </div>
  );
}
