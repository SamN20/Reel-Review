import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type SubCategoryInsight = {
  subject: string;
  count: number;
  average_score: number | null;
};

export function SubCategoryRadar({ data }: { data: SubCategoryInsight[] }) {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map((item) => item.count), 0);
  const chartData = data.map((item) => ({
    ...item,
    usage_score: maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0,
  }));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Engagement by Sub-Category</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Shows how often a Category is used relative to the others.
        </p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="78%" data={chartData}>
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={12} />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              stroke="#71717a"
              fontSize={10}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#f4f4f5" }}
              formatter={(_value, name, item) => {
                const payload = item.payload as SubCategoryInsight & { usage_score: number };
                if (name === "Usage") {
                  return [`${payload.count} ratings`, name];
                }
                return [payload.average_score === null ? "N/A" : `${payload.average_score}/100`, name];
              }}
            />
            <Legend />
            <Radar
              name="Usage"
              dataKey="usage_score"
              stroke="#dc2626"
              fill="#dc2626"
              fillOpacity={0.3}
            />
            <Radar
              name="Average Score"
              dataKey="average_score"
              stroke="#fbbf24"
              fill="#fbbf24"
              fillOpacity={0.18}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
