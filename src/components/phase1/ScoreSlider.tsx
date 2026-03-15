import { useRef, useState } from 'react';

interface ScoreSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function ScoreSlider({ value, onChange, min = 0, max = 100 }: ScoreSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="relative pt-6 pb-1">
      {/* Floating value bubble */}
      <div
        className="absolute top-0 pointer-events-none"
        style={{
          left: `calc(${pct}% - 16px + ${(50 - pct) * 0.22}px)`,
          opacity: isDragging ? 1 : 0.8,
          transition: 'opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className={`
          px-1.5 py-0.5 rounded text-[10px] font-semibold text-white tabular-nums text-center min-w-[32px]
          transition-all duration-200 ease-out
          ${isDragging ? 'bg-blue-600 scale-110 shadow-sm' : 'bg-slate-400'}
        `}>
          {value}
        </div>
        {/* Arrow */}
        <div
          className={`w-0 h-0 mx-auto border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent transition-colors duration-200 ease-out ${isDragging ? 'border-t-blue-600' : 'border-t-slate-400'}`}
        />
      </div>

      {/* Slider track area */}
      <div ref={trackRef} className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onBlur={() => setIsDragging(false)}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #3b82f6 ${pct}%, #e2e8f0 ${pct}%)`,
          }}
        />
      </div>

      {/* Min/Max endpoint labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-400 tabular-nums font-medium">{min}</span>
        <span className="text-[10px] text-slate-400 tabular-nums font-medium">{max}</span>
      </div>
    </div>
  );
}
