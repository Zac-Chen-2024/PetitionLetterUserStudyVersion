import { useTranslation } from 'react-i18next';
import type { DimensionDef } from '../../types/index.ts';
import ScoreSlider from './ScoreSlider.tsx';

interface DimensionRatingProps {
  dimension: DimensionDef;
  value: number;
  onChange: (value: number) => void;
}

export default function DimensionRating({ dimension, value, onChange }: DimensionRatingProps) {
  const { i18n } = useTranslation();
  const name = i18n.language === 'zh' ? dimension.name_zh : dimension.name_en;
  const desc = i18n.language === 'zh' ? dimension.description_zh : dimension.description_en;
  const showDesc = desc && desc !== 'TBD' && desc !== '待定';

  return (
    <div className="bg-white rounded-lg p-3 border border-slate-100/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)] transition-shadow duration-200 ease-out">
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-xs font-semibold text-slate-700 tracking-tight">{name}</span>
        {showDesc && (
          <span className="text-[10px] text-slate-400 leading-tight">{desc}</span>
        )}
      </div>
      <ScoreSlider value={value} onChange={onChange} min={dimension.min} max={dimension.max} />
    </div>
  );
}
