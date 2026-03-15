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
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xs font-medium text-slate-700">{name}</span>
        {showDesc && (
          <span className="text-[10px] text-slate-400">{desc}</span>
        )}
      </div>
      <ScoreSlider value={value} onChange={onChange} min={dimension.min} max={dimension.max} />
    </div>
  );
}
