export function InsightsPanel({ divisiveness, topRaters }: { divisiveness: any, topRaters: any[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-zinc-100 mb-6 tracking-tight">Community Insights</h3>
        
        <div className="mb-6">
          <h4 className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Most Divisive Movie</h4>
          {divisiveness?.title ? (
            <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <span className="font-bold text-zinc-200 truncate pr-2">{divisiveness.title}</span>
              <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded text-xs whitespace-nowrap">
                Var: {divisiveness.variance}
              </span>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">Not enough data.</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Top Raters (Retention)</h4>
        {topRaters && topRaters.length > 0 ? (
          <div className="space-y-2">
            {topRaters.map((rater, idx) => (
              <div key={idx} className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <div className="flex items-center">
                  <span className="text-zinc-500 font-bold w-4 mr-2">{idx + 1}.</span>
                  <span className="font-bold text-zinc-200">{rater.username}</span>
                </div>
                <span className="text-zinc-400 text-sm font-bold">{rater.count} Votes</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No raters found.</p>
        )}
      </div>
    </div>
  );
}
