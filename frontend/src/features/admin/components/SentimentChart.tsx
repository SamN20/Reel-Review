import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type SentimentDataPoint = {
  score: number;
  count: number;
};

type SentimentChartData = {
  movie_title?: string | null;
  total_ratings?: number;
  data?: SentimentDataPoint[];
};

export function SentimentChart({ data }: { data: SentimentChartData | SentimentDataPoint[] | null }) {
  const chartData = Array.isArray(data) ? data : data?.data ?? [];
  const movieTitle = Array.isArray(data) ? null : data?.movie_title;
  const totalRatings = Array.isArray(data) ? null : data?.total_ratings;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Recent Drop Sentiment</h3>
        {movieTitle ? (
          <p className="mt-1 text-sm text-zinc-400">
            {movieTitle}
            {typeof totalRatings === "number" ? ` • ${totalRatings} approved ratings` : ""}
          </p>
        ) : null}
      </div>
      <div className="h-64 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="score"
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}-${Math.min(Number(value) + 9, 100)}`}
              />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#f4f4f5" }}
                cursor={{ fill: "#27272a" }}
                formatter={(value) => [`${value ?? 0}`, "Votes"]}
                labelFormatter={(value) => `Score ${value}-${Math.min(Number(value) + 9, 100)}`}
              />
              <Bar dataKey="count" name="Votes" fill="#0078b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-800 text-sm text-zinc-500">
            No approved ratings yet for this drop.
          </div>
        )}
      </div>
    </div>
  );
}
