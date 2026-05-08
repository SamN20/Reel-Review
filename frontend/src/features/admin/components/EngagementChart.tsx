import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type EngagementPoint = {
  drop_id: number;
  movie_title: string;
  date: string;
  on_time_votes: number;
  late_votes: number;
  total_users: number;
};

type RangeKey = "month" | "sixMonths" | "year" | "all";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "month", label: "1M" },
  { key: "sixMonths", label: "6M" },
  { key: "year", label: "1Y" },
  { key: "all", label: "All" },
];

function subtractMonths(baseDate: Date, months: number) {
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() - months);
  return nextDate;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function formatWeeklyDropDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function truncateLabel(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}

function getVisibleData(data: EngagementPoint[], range: RangeKey) {
  if (range === "all") {
    return data;
  }

  const latestDate = data.length > 0 ? new Date(data[data.length - 1].date) : new Date();
  const cutoff =
    range === "month"
      ? subtractMonths(latestDate, 1)
      : range === "sixMonths"
        ? subtractMonths(latestDate, 6)
        : subtractMonths(latestDate, 12);

  const filtered = data.filter((item) => new Date(item.date) >= cutoff);
  return filtered.length > 0 ? filtered : data.slice(-Math.min(data.length, range === "month" ? 4 : range === "sixMonths" ? 12 : 24));
}

function formatTickLabel(item: EngagementPoint, totalPoints: number) {
  if (totalPoints > 36) {
    return "";
  }

  if (totalPoints > 20) {
    return formatShortDate(item.date);
  }

  if (totalPoints > 10) {
    return truncateLabel(item.movie_title, 8);
  }

  return truncateLabel(item.movie_title, 14);
}

export function EngagementChart({ data }: { data: EngagementPoint[] }) {
  const [range, setRange] = useState<RangeKey>("sixMonths");

  if (!data || data.length === 0) return null;

  const visibleData = getVisibleData(data, range);
  const chartWidth = Math.max(visibleData.length * 72, 320);
  const hideDots = visibleData.length > 24;

  return (
    <div className="overflow-hidden bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Engagement History</h3>
          <p className="mt-1 text-sm text-zinc-400">Current and past drops only. Switch ranges as the archive grows.</p>
        </div>
        <div className="inline-flex w-full rounded-lg border border-zinc-800 bg-zinc-950 p-1 sm:w-auto">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setRange(option.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors sm:flex-none ${
                range === option.key
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="custom-scrollbar overflow-x-auto overflow-y-hidden pb-2">
        <div style={{ minWidth: `${chartWidth}px` }} className="h-72 w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visibleData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="drop_id"
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={range === "all" ? 28 : 16}
                interval="preserveStartEnd"
                tickFormatter={(value) => {
                  const item = visibleData.find((entry) => entry.drop_id === value);
                  return item ? formatTickLabel(item, visibleData.length) : "";
                }}
              />
              <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                allowEscapeViewBox={{ x: false, y: false }}
                contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#f4f4f5" }}
                itemStyle={{ color: "#f4f4f5" }}
                labelFormatter={(value) => {
                  const item = visibleData.find((entry) => entry.drop_id === value);
                  if (!item) {
                    return "";
                  }
                  return `${item.movie_title} • Weekly drop: ${formatWeeklyDropDate(item.date)}`;
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="on_time_votes"
                name="On Time"
                stroke="#dc2626"
                strokeWidth={3}
                dot={hideDots ? false : { r: 3, fill: "#dc2626" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="late_votes"
                name="Late"
                stroke="#fbbf24"
                strokeWidth={3}
                dot={hideDots ? false : { r: 3, fill: "#fbbf24" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
