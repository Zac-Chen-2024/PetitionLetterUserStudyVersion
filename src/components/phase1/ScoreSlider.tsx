interface ScoreSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function ScoreSlider({ value, onChange, min = 0, max = 100 }: ScoreSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #3b82f6 ${pct}%, #e2e8f0 ${pct}%)`,
          }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700 w-8 text-right tabular-nums">{value}</span>
    </div>
  );
}
