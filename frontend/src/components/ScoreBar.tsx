interface ScoreBarProps {
    score: number;
    setScore: (val: number) => void;
    size?: "large" | "small";
}

export const ScoreBar = ({ score, setScore, size = "large" }: ScoreBarProps) => {
    return (
        <div className="flex gap-1 w-full">
            {[...Array(10)].map((_, i) => {
                const val = (i + 1) * 10;
                const isActive = score >= val;
                return (
                    <button
                        key={val}
                        onClick={() => setScore(score === val ? 0 : val)}
                        className={`flex-1 transition-all duration-200 rounded-sm ${size === "large" ? "h-12 md:h-14" : "h-8"
                            } ${isActive
                                ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                                : 'bg-zinc-800 hover:bg-zinc-700'
                            }`}
                    />
                );
            })}
        </div>
    );
};
