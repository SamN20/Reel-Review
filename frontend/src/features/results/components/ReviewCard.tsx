import { User, Award, TrendingUp, MessageSquare, Flag } from 'lucide-react';

interface Review {
  id: number;
  user_name: string;
  overall_score: number;
  review_text: string;
  is_spoiler: boolean;
}

interface ReviewCardProps {
  review: Review;
  isHighestMatch?: boolean;
  officialScore: number;
}

export function ReviewCard({ review, isHighestMatch, officialScore }: ReviewCardProps) {
  const isMatch = review.overall_score >= officialScore;

  const handleReport = () => {
    alert("Report feature coming soon. Thank you for keeping the community safe.");
  };

  return (
    <div className="p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700">
            <User size={20} />
          </div>
          <div>
            <div className="font-bold text-zinc-200 flex items-center gap-2">
              {review.user_name}
              {isHighestMatch && (
                <span title="Highest community match to your taste">
                  <Award size={14} className="text-amber-500" />
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-500">
              {review.user_name === "Anonymous" ? "Secret Voter" : "Community Member"}
            </div>
          </div>
        </div>

        {/* User's Score Pill */}
        <div className={`px-3 py-1 rounded-lg text-sm font-black tabular-nums border ${isMatch ? 'bg-green-950/30 text-green-400 border-green-900/50' : 'bg-amber-950/30 text-amber-500 border-amber-900/50'}`}>
          {review.overall_score}
        </div>
      </div>

      <p className="text-zinc-300 leading-relaxed text-[15px] whitespace-pre-wrap">
        {review.review_text}
      </p>

      <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5">
            <TrendingUp size={14} /> 0
          </button>
          <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5">
            <MessageSquare size={14} /> Reply
          </button>
        </div>
        <button 
          onClick={handleReport}
          className="text-xs font-bold text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1.5"
          title="Report as harmful, spam, or spoiler"
        >
          <Flag size={14} /> Report
        </button>
      </div>
    </div>
  );
}
