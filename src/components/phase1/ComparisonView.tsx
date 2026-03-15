import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MaterialData, DimensionDef, ScrollEvent } from '../../types/index.ts';
import LetterColumn from './LetterColumn.tsx';

const SYSTEM_LABELS = ['System A', 'System B', 'System C'];

interface ComparisonViewProps {
  material: MaterialData;
  dimensions: DimensionDef[];
  columnOrder: number[];
  materialIndex: number;
  totalMaterials: number;
  scores: Record<string, number>[];
  comments: string[];
  scoringRevealed: boolean[];
  onScoreChange: (sysIdx: number, dimId: string, value: number) => void;
  onCommentChange: (sysIdx: number, value: string) => void;
  onScoringRevealed: (colIdx: number) => void;
  onScroll: (event: ScrollEvent) => void;
  onBack?: () => void;
  onNext: () => void;
  allColumnsRevealed: boolean;
  isLastMaterial: boolean;
}

export default function ComparisonView({
  material, dimensions, columnOrder, materialIndex, totalMaterials,
  scores, comments, scoringRevealed, onScoreChange, onCommentChange,
  onScoringRevealed, onScroll, onBack, onNext, allColumnsRevealed, isLastMaterial,
}: ComparisonViewProps) {
  const { t } = useTranslation();

  const FONT_SIZES = [14, 16, 18] as const;
  const [fontSizeIdx, setFontSizeIdx] = useState(1); // default: 16px (middle)
  const fontSize = FONT_SIZES[fontSizeIdx];

  const orderedSources = columnOrder.map(i => material.sources[i]);

  // Determine if each column has been interacted with (score differs from default 50)
  const columnScored = scores.map(colScores =>
    Object.values(colScores).some(v => v !== 50)
  );

  // Step dots for material progress
  const stepDots = useMemo(() => {
    return Array.from({ length: totalMaterials }, (_, i) => {
      if (i < materialIndex) return 'completed';
      if (i === materialIndex) return 'current';
      return 'upcoming';
    });
  }, [materialIndex, totalMaterials]);

  return (
    <div className="flex flex-col h-full">
      {/* Header area */}
      <div className="px-6 py-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm shrink-0">
        {/* Row 1: Title + Progress dots */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">Phase 1/3: Comparative Evaluation</h1>

          {totalMaterials > 1 && (
            <div className="flex items-center gap-2">
              {stepDots.map((status, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`step-dot w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                      status === 'completed'
                        ? 'bg-blue-600 border-blue-600 shadow-[0_0_0_2px_rgba(37,99,235,0.1)]'
                        : status === 'current'
                          ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-100/80 shadow-[0_0_0_1px_rgba(37,99,235,0.15)]'
                          : 'bg-white border-slate-300'
                    }`}
                  />
                  {i < totalMaterials - 1 && (
                    <div className={`w-6 h-px transition-colors duration-300 ${i < materialIndex ? 'bg-blue-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
              <span className="text-xs text-slate-400 ml-2 tabular-nums font-medium">
                {materialIndex + 1}/{totalMaterials}
              </span>
            </div>
          )}
        </div>

        {/* Row 2: Material title + Back/Next */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-blue-600 font-medium tracking-tight">{material.title}</p>

          <div className="flex items-center gap-3">
            {/* Font size controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFontSizeIdx(i => i - 1)}
                disabled={fontSizeIdx === 0}
                className={`w-7 h-7 rounded-md text-xs font-semibold flex items-center justify-center transition-all duration-150 ${
                  fontSizeIdx === 0
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-100 active:scale-95'
                }`}
                title="Decrease font size"
              >
                A−
              </button>
              <span className="text-[10px] text-slate-400 tabular-nums w-7 text-center">{fontSize}px</span>
              <button
                onClick={() => setFontSizeIdx(i => i + 1)}
                disabled={fontSizeIdx === FONT_SIZES.length - 1}
                className={`w-7 h-7 rounded-md text-sm font-semibold flex items-center justify-center transition-all duration-150 ${
                  fontSizeIdx === FONT_SIZES.length - 1
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-100 active:scale-95'
                }`}
                title="Increase font size"
              >
                A+
              </button>
            </div>

            <div className="w-px h-5 bg-slate-200" />
            {onBack && (
              <button
                onClick={onBack}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] transition-all duration-200 ease-out flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {t('common.back')}
              </button>
            )}
            <button
              onClick={onNext}
              disabled={!allColumnsRevealed}
              className={`
                px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ease-out flex items-center gap-1
                ${allColumnsRevealed
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97] shadow-sm hover:shadow-md' + (isLastMaterial ? ' submit-pulse' : '')
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }
              `}
            >
              {isLastMaterial ? t('phase1.submitRatings') : t('common.next')}
              {!isLastMaterial && (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div className="px-6 py-3 shrink-0">
        <p className="text-sm text-slate-500 leading-relaxed">{t('phase1.instruction')}</p>
      </div>

      {/* Three columns */}
      <div className="flex-1 px-5 pb-3 grid grid-cols-3 gap-5 min-h-0">
        {orderedSources.map((source, idx) => (
          <LetterColumn
            key={source.sourceId}
            label={SYSTEM_LABELS[idx]}
            sections={source.sections}
            fontSize={fontSize}
            columnIndex={idx}
            onScroll={onScroll}
            onScoringRevealed={onScoringRevealed}
            dimensions={dimensions}
            scores={scores[idx]}
            onScoreChange={(dimId, v) => onScoreChange(idx, dimId, v)}
            comment={comments[idx]}
            onCommentChange={(v) => onCommentChange(idx, v)}
            isScored={columnScored[idx]}
            forceShowScoring={scoringRevealed[idx]}
          />
        ))}
      </div>
    </div>
  );
}
