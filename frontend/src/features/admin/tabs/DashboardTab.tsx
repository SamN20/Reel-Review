import { useState, useEffect } from "react";
import axios from "axios";
import { StatCard } from "../components/StatCard";
import { ActiveDropCard } from "../components/ActiveDropCard";
import { EngagementChart } from "../components/EngagementChart";
import { SentimentChart } from "../components/SentimentChart";
import { SubCategoryRadar } from "../components/SubCategoryRadar";
import { InsightsPanel } from "../components/InsightsPanel";
import { ModerationAlert } from "../components/ModerationAlert";

const API_URL = import.meta.env.VITE_API_URL || "";

export function DashboardTab() {
  const [stats, setStats] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch legacy basic stats
        const resStats = await axios.get(`${API_URL}/api/v1/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(resStats.data);

        // Fetch new comprehensive dashboard stats
        const resDash = await axios.get(`${API_URL}/api/v1/admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboardData(resDash.data);

      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Platform Overview</h2>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats.total_users} />
          <StatCard title="Total Movies" value={stats.total_movies} />
          <StatCard title="Total Ratings" value={stats.total_ratings} />
          <StatCard title="Weekly Drops" value={stats.total_drops} />
        </div>
      )}

      {dashboardData?.moderation_count > 0 && (
        <ModerationAlert count={dashboardData.moderation_count} />
      )}

      {dashboardData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Active Drop & Insights */}
          <div className="flex flex-col space-y-6">
            <ActiveDropCard data={dashboardData.active_drop} />
            <InsightsPanel divisiveness={dashboardData.divisiveness} topRaters={dashboardData.top_raters} />
          </div>

          {/* Right Column (2-span): Charts */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <EngagementChart data={dashboardData.engagement} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SentimentChart data={dashboardData.sentiment} />
              <SubCategoryRadar data={dashboardData.insights} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64 text-zinc-500">
          Loading comprehensive analytics...
        </div>
      )}
    </div>
  );
}
