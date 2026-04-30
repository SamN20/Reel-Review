export function StatCard({ title, value }: { title: string, value: number }) {
  return (
    <div className="bg-zinc-900 p-4 sm:p-6 rounded-xl border border-zinc-800">
      <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">{title}</p>
      <p className="text-3xl sm:text-4xl font-bold text-white">{value}</p>
    </div>
  );
}
