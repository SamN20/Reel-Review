import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useDraggableScroll } from "../../../hooks/useDraggableScroll";
import { API_URL } from "../../../lib/api";

interface User {
  id: number;
  username: string;
  email: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  invite_code?: string | null;
  referred_by_user_id?: number | null;
}

interface ReferralLeaderboardRow {
  inviter_user_id: number;
  inviter_username: string;
  inviter_display_name: string | null;
  invite_code: string;
  referral_count: number;
}

interface ReferralRecentRow {
  referred_user_id: number;
  referred_username: string;
  referred_display_name: string | null;
  inviter_user_id: number;
  inviter_username: string;
  inviter_display_name: string | null;
  referral_attributed_at: string;
}

interface ReferralSummary {
  inviters: ReferralLeaderboardRow[];
  recent_signups: ReferralRecentRow[];
}

export function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const scrollProps = useDraggableScroll<HTMLDivElement>();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      const referralRes = await axios.get(`${API_URL}/api/v1/admin/referrals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReferralSummary(referralRes.data);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (
    userId: number,
    field: "is_active" | "is_admin",
    value: boolean,
  ) => {
    if (userId === currentUser?.id) {
      alert("You cannot modify your own administrative or active status here.");
      return;
    }

    // Optimistic UI update
    const previousUsers = [...users];
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, [field]: value } : u)),
    );

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/api/v1/admin/users/${userId}`,
        {
          [field]: value,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update user status");
      setUsers(previousUsers); // Rollback
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  if (loading) return <div className="text-zinc-400">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">User Management</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 bg-red-950/20 p-4 rounded-lg border border-red-900/50">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="border-b border-zinc-800 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Top Inviters</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {referralSummary?.inviters.length ? referralSummary.inviters.map((row) => (
              <div key={row.inviter_user_id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="font-medium text-white">{row.inviter_display_name || row.inviter_username}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">@{row.inviter_username} · {row.invite_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-400">{row.referral_count}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Referrals</p>
                </div>
              </div>
            )) : <div className="px-6 py-8 text-sm text-zinc-500">No referrals have been attributed yet.</div>}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="border-b border-zinc-800 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Recent Referred Signups</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {referralSummary?.recent_signups.length ? referralSummary.recent_signups.map((row) => (
              <div key={row.referred_user_id} className="px-6 py-4">
                <p className="font-medium text-white">{row.referred_display_name || row.referred_username}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  @{row.referred_username} joined via @{row.inviter_username}
                </p>
                <p className="mt-2 text-xs text-zinc-500">{new Date(row.referral_attributed_at).toLocaleString()}</p>
              </div>
            )) : <div className="px-6 py-8 text-sm text-zinc-500">No referred signups yet.</div>}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div
          {...scrollProps}
          className="overflow-x-auto custom-scrollbar cursor-grab active:cursor-grabbing"
        >
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Invite</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-white">
                        {user.username}
                      </div>
                      {user.email && (
                        <div className="text-zinc-500 text-xs mt-0.5">
                          {user.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500">
                      <div>{user.invite_code || "—"}</div>
                      <div>{user.referred_by_user_id ? `via #${user.referred_by_user_id}` : "Direct"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.is_active ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"}`}
                      >
                        {user.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.is_admin ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-zinc-800 text-zinc-300 border border-zinc-700"}`}
                      >
                        {user.is_admin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              user.id,
                              "is_admin",
                              !user.is_admin,
                            )
                          }
                          disabled={user.id === currentUser?.id}
                          className={`px-3 py-1.5 rounded transition-colors ${user.id === currentUser?.id ? "text-zinc-600 bg-zinc-900 cursor-not-allowed" : "text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-white"}`}
                        >
                          {user.is_admin ? "Revoke Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              user.id,
                              "is_active",
                              !user.is_active,
                            )
                          }
                          disabled={
                            user.id === currentUser?.id || user.is_admin
                          }
                          className={`px-3 py-1.5 rounded transition-colors ${user.id === currentUser?.id || user.is_admin ? "text-zinc-600 bg-zinc-900 cursor-not-allowed" : user.is_active ? "text-red-400 bg-red-950/30 hover:bg-red-900/50" : "text-green-400 bg-green-950/30 hover:bg-green-900/50"}`}
                          title={user.is_admin ? "Cannot suspend an admin" : ""}
                        >
                          {user.is_active ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No users found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
