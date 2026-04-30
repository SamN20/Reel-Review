import { useState, useEffect } from 'react';
import axios from 'axios';
import { StatCard } from '../components/StatCard';

const API_URL = import.meta.env.VITE_API_URL || '';

export function DashboardTab() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/v1/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-6">Platform Overview</h2>
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard title="Total Users" value={stats.total_users} />
          <StatCard title="Total Movies" value={stats.total_movies} />
          <StatCard title="Total Ratings" value={stats.total_ratings} />
          <StatCard title="Weekly Drops" value={stats.total_drops} />
        </div>
      ) : (
        <p>Loading stats...</p>
      )}
    </div>
  );
}
