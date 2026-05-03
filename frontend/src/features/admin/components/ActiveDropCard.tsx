import { useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";

export function ActiveDropCard({ data }: { data: any }) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  if (!data) return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-400">
      No active drop available.
    </div>
  );

  const participation = data.total_active_users > 0 
    ? Math.round((data.votes_cast / data.total_active_users) * 100) 
    : 0;

  const handleSendReminder = async () => {
    setSending(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("token");
      const API_URL = import.meta.env.VITE_API_URL || "";
      const res = await axios.post(`${API_URL}/api/v1/admin/reminders/weekend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Failed to send reminder");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-zinc-100 mb-1 tracking-tight">Active Drop</h3>
        <h2 className="text-2xl font-black text-red-600 tracking-tighter mb-4">{data.movie_title || "Unknown"}</h2>
        
        <div className="mb-2 flex justify-between text-sm text-zinc-400">
          <span>Participation</span>
          <span className="font-bold text-zinc-100">{data.votes_cast} / {data.total_active_users} ({participation}%)</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-6">
          <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${participation}%` }}></div>
        </div>
      </div>
      
      <div>
        <button 
          onClick={handleSendReminder}
          disabled={sending}
          className="w-full py-3 px-4 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-md flex items-center justify-center transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4 mr-2" />
          {sending ? "Sending..." : "Send Weekend Reminder"}
        </button>
        {message && <p className="mt-2 text-xs text-center text-zinc-400">{message}</p>}
      </div>
    </div>
  );
}
