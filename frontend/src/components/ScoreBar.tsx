interface ScoreBarProps {
  score: number;
  setScore: (val: number) => void;
  size?: "large" | "small";
  disabled?: boolean;
}

export const ScoreBar = ({
  score,
  setScore,
  size = "large",
  disabled = false,
}: ScoreBarProps) => {
  return (
    <div className={`flex gap-1 w-full ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      {[...Array(10)].map((_, i) => {
        const val = (i + 1) * 10;
        const isActive = score >= val;
        return (
          <button
            key={val}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setScore(score === val ? 0 : val)}
            className={`flex-1 transition-all duration-200 rounded-sm ${
              size === "large" ? "h-12 md:h-14" : "h-8"
            } ${
              isActive
                ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                : "bg-zinc-800"
            } ${!disabled ? "hover:bg-red-500" : ""}`}
          />
        );
      })}
    </div>
  );
};
