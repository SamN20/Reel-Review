import { Activity } from 'lucide-react';

interface SubCategoryAverages {
  story?: number | null;
  performances?: number | null;
  visuals?: number | null;
  sound?: number | null;
  rewatchability?: number | null;
  enjoyment?: number | null;
  emotional_impact?: number | null;
}

interface SubCategoryBreakdownProps {
  subCategories: SubCategoryAverages;
}

export function SubCategoryBreakdown({ subCategories }: SubCategoryBreakdownProps) {
  const categories = [
    { label: "Visuals & Cinematography", score: subCategories.visuals },
    { label: "Sound & Score", score: subCategories.sound },
    { label: "Performances", score: subCategories.performances },
    { label: "Story & Pacing", score: subCategories.story },
    { label: "Pure Enjoyment", score: subCategories.enjoyment },
    { label: "Emotional Impact", score: subCategories.emotional_impact },
    { label: "Rewatchability", score: subCategories.rewatchability },
  ].filter(c => c.score != null);

  if (categories.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
        <Activity className="text-red-500" size={20} /> The Breakdown
      </h3>

      <div className="space-y-5">
        {categories.map((cat, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-zinc-300">{cat.label}</span>
              <span className="font-bold text-zinc-400 tabular-nums">{cat.score}</span>
            </div>
            {/* Segmented Progress Bar visually mirroring the voting UI */}
            <div className="flex gap-0.5 h-2.5">
              {[...Array(10)].map((_, blockIdx) => {
                const blockValue = (blockIdx + 1) * 10;
                const score = cat.score || 0;
                const isFilled = score >= blockValue;
                const isPartial = score > (blockValue - 10) && score < blockValue;

                return (
                  <div
                    key={blockIdx}
                    className={`flex-1 rounded-sm ${
                      isFilled ? 'bg-red-600' : isPartial ? 'bg-red-900/50' : 'bg-zinc-800'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
