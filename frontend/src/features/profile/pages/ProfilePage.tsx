import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../../../context/AuthContext";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { usePageMeta } from "../../../lib/seo";
import { PrivacySettingsPanel } from "../components/PrivacySettingsPanel";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileTabs } from "../components/ProfileTabs";
import { RatingGrid } from "../components/RatingGrid";
import { ReferralPanel } from "../components/ReferralPanel";
import type { ProfileTab, ReferralSummary, UserProfile } from "../types";

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("recent");
  const [useDisplayName, setUseDisplayName] = useState(false);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);
  const [publicProfile, setPublicProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const isPublicView = Boolean(username);
  const API_URL = import.meta.env.VITE_API_URL || "";
  const KEYN_BASE_URL = import.meta.env.VITE_KEYN_BASE_URL || "";
  const keynProfileUrl = KEYN_BASE_URL
    ? `${KEYN_BASE_URL.replace(/\/$/, "")}/profile/edit`
    : "";
  const preferredName =
    profile?.use_display_name && profile?.display_name
      ? profile.display_name
      : profile?.username;

  usePageMeta({
    title: preferredName
      ? `${preferredName} | Reel Review`
      : isPublicView
        ? "Public Profile | Reel Review"
        : "Profile | Reel Review",
    description: profile
      ? `${preferredName}'s Reel Review profile with ${profile.total_votes} ratings and an average score of ${profile.average_score}/100.`
      : "Browse a Reel Review community profile and recent ratings.",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isPublicView && !user) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        let url = "";
        let headers = {};

        if (isPublicView) {
          url = `${API_URL}/api/v1/users/by-username/${username}/profile`;
          if (token) {
            headers = { Authorization: `Bearer ${token}` };
          }
        } else {
          url = `${API_URL}/api/v1/users/${user?.id}/profile`;
          headers = { Authorization: `Bearer ${token}` };
        }

        const response = await axios.get(url, { headers });
        setProfile(response.data);

        if (!isPublicView && user) {
          setUseDisplayName(user.use_display_name);
          setShowOnLeaderboard(user.show_on_leaderboard);
          setPublicProfile(user.public_profile);

          const referralResponse = await axios.get(`${API_URL}/api/v1/users/me/referral`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setReferralSummary(referralResponse.data);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [API_URL, authLoading, isPublicView, user, username]);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/v1/users/me/preferences`,
        {
          use_display_name: useDisplayName,
          show_on_leaderboard: showOnLeaderboard,
          public_profile: publicProfile,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      updateUser({
        use_display_name: useDisplayName,
        show_on_leaderboard: showOnLeaderboard,
        public_profile: publicProfile,
      });
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setSavingSettings(false);
    }
  };

  const copyInviteLink = async () => {
    if (!referralSummary?.invite_url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(referralSummary.invite_url);
      setCopyStatus("copied");
    } catch (error) {
      console.error("Failed to copy invite link", error);
      setCopyStatus("error");
    } finally {
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!isPublicView && !user) {
    return <Navigate to="/?login=true" />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 pt-24 pb-12 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-red-600 w-8 h-8" />
          </div>
        ) : profile ? (
          <div className="space-y-8">
            <ProfileHeader
              profile={profile}
              preferredName={preferredName}
              isPublicView={isPublicView}
              keynProfileUrl={keynProfileUrl}
            />

            <ProfileTabs
              activeTab={activeTab}
              isPublicView={isPublicView}
              onChange={setActiveTab}
            />

            <div className="py-4">
              {activeTab === "recent" && (
                <RatingGrid
                  ratings={profile.recent_ratings}
                  emptyMessage="No recent activity."
                />
              )}

              {activeTab === "favorites" && (
                <RatingGrid
                  ratings={profile.favorite_movies}
                  emptyMessage="No favorite movies found yet. Start rating!"
                />
              )}

              {activeTab === "invites" && !isPublicView && (
                <ReferralPanel
                  referralSummary={referralSummary}
                  copyStatus={copyStatus}
                  onCopy={copyInviteLink}
                />
              )}

              {activeTab === "settings" && (
                <PrivacySettingsPanel
                  useDisplayName={useDisplayName}
                  showOnLeaderboard={showOnLeaderboard}
                  publicProfile={publicProfile}
                  savingSettings={savingSettings}
                  onUseDisplayNameChange={setUseDisplayName}
                  onShowOnLeaderboardChange={setShowOnLeaderboard}
                  onPublicProfileChange={setPublicProfile}
                  onSave={saveSettings}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-12">Failed to load profile.</div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
