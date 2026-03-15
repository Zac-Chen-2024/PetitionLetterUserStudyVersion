import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { MaterialData, DimensionDef, SystemRating, ScrollEvent, MaterialSetResult } from '../../types/index.ts';
import LetterColumn from './LetterColumn.tsx';
import ConfirmModal from '../shared/ConfirmModal.tsx';

const SYSTEM_LABELS = ['System A', 'System B', 'System C'];

interface ComparisonViewProps {
  material: MaterialData;
  dimensions: DimensionDef[];
  columnOrder: number[];
  materialIndex: number;
  totalMaterials: number;
  onComplete: (result: MaterialSetResult) => void;
}

export default function ComparisonView({ material, dimensions, columnOrder, materialIndex, totalMaterials, onComplete }: ComparisonViewProps) {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [scoringRevealed, setScoringRevealed] = useState<boolean[]>([false, false, false]);
  const scrollEventsRef = useRef<ScrollEvent[]>([]);
  const readingStartRef = useRef(Date.now());

  const orderedSources = columnOrder.map(i => material.sources[i]);
  const columnOrderIds = orderedSources.map(s => s.sourceId);

  const [scores, setScores] = useState<Record<string, number>[]>(
    SYSTEM_LABELS.map(() => Object.fromEntries(dimensions.map(d => [d.id, 50])))
  );
  const [comments, setComments] = useState<string[]>(SYSTEM_LABELS.map(() => ''));

  const allRevealed = scoringRevealed.every(Boolean);

  const handleScroll = useCallback((event: ScrollEvent) => {
    scrollEventsRef.current.push(event);
  }, []);

  const handleScoringRevealed = useCallback((colIdx: number) => {
    setScoringRevealed(prev => {
      const copy = [...prev];
      copy[colIdx] = true;
      return copy;
    });
  }, []);

  const updateScore = (sysIdx: number, dimId: string, value: number) => {
    setScores(prev => {
      const copy = [...prev];
      copy[sysIdx] = { ...copy[sysIdx], [dimId]: value };
      return copy;
    });
  };

  const updateComment = (sysIdx: number, value: string) => {
    setComments(prev => {
      const copy = [...prev];
      copy[sysIdx] = value;
      return copy;
    });
  };

  const doSubmit = () => {
    const readingDuration = Math.round((Date.now() - readingStartRef.current) / 1000);
    const ratings: SystemRating[] = SYSTEM_LABELS.map((label, i) => ({
      systemLabel: label,
      sourceId: columnOrderIds[i],
      scores: scores[i],
      comment: comments[i],
    }));
    onComplete({
      materialId: material.materialId,
      columnOrder: columnOrderIds,
      readingDuration,
      scrollEvents: scrollEventsRef.current,
      ratings,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Title bar with submit */}
      <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-800">{t('phase1.title')}</h1>
          {totalMaterials > 1 && (
            <span className="text-sm text-slate-500">
              {t('phase1.material')} {materialIndex + 1} / {totalMaterials}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!allRevealed}
          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {t('phase1.submitRatings')}
        </button>
      </div>

      {/* Instruction */}
      <div className="px-6 py-3 shrink-0">
        <p className="text-sm text-slate-600 leading-relaxed">{t('phase1.instruction')}</p>
      </div>

      {/* Three columns */}
      <div className="flex-1 px-4 pb-3 grid grid-cols-3 gap-4 min-h-0">
        {orderedSources.map((source, idx) => (
          <LetterColumn
            key={source.sourceId}
            label={SYSTEM_LABELS[idx]}
            sections={source.sections}
            columnIndex={idx}
            onScroll={handleScroll}
            onScoringRevealed={handleScoringRevealed}
            dimensions={dimensions}
            scores={scores[idx]}
            onScoreChange={(dimId, v) => updateScore(idx, dimId, v)}
            comment={comments[idx]}
            onCommentChange={(v) => updateComment(idx, v)}
          />
        ))}
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        open={showConfirm}
        title={t('phase1.submitRatings')}
        message={t('phase1.confirmSubmit')}
        confirmText={t('common.submit')}
        cancelText={t('common.cancel')}
        onConfirm={() => { setShowConfirm(false); doSubmit(); }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
