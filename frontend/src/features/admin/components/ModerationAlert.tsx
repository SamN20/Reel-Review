import { AlertCircle } from "lucide-react";

export function ModerationAlert({ count }: { count: number }) {
  if (!count || count === 0) return null;
  
  return (
    <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4 flex items-center justify-between mt-4">
      <div className="flex items-center text-red-400">
        <AlertCircle className="w-5 h-5 mr-3" />
        <span className="font-bold">Moderation Action Required</span>
      </div>
      <div className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
        {count}
      </div>
    </div>
  );
}
