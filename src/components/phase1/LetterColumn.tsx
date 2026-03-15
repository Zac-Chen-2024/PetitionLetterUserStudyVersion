import { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PetitionSection, ScrollEvent, DimensionDef } from '../../types/index.ts';
import DimensionRating from './DimensionRating.tsx';

const BADGE_STYLES: Record<string, string> = {
  'System A': 'bg-blue-100 text-blue-700',
  'System B': 'bg-emerald-100 text-emerald-700',
  'System C': 'bg-amber-100 text-amber-700',
};

interface LetterColumnProps {
  label: string;
  sections: PetitionSection[];
  columnIndex: number;
  onScroll?: (event: ScrollEvent) => void;
  onScoringRevealed?: (columnIndex: number) => void;
  dimensions: DimensionDef[];
  scores: Record<string, number>;
  onScoreChange: (dimId: string, value: number) => void;
  comment: string;
  onCommentChange: (value: string) => void;
}

export default function LetterColumn({
  label, sections, columnIndex, onScroll, onScoringRevealed,
  dimensions, scores, onScoreChange, comment, onCommentChange,
}: LetterColumnProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scoringRef = useRef<HTMLDivElement>(null);
  const [showScoring, setShowScoring] = useState(false);
  const revealedRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const scrollPercent = el.scrollHeight > el.clientHeight
      ? Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
      : 100;

    // Report scroll event
    onScroll?.({ columnIndex, scrollPercent, timestamp: Date.now() });

    // Auto-reveal scoring when scrolled to bottom (>=95%)
    if (scrollPercent >= 95 && !revealedRef.current) {
      revealedRef.current = true;
      setShowScoring(true);
      onScoringRevealed?.(columnIndex);
    }
  }, [columnIndex, onScroll, onScoringRevealed]);

  // Check on mount if content doesn't overflow (short content = already at bottom)
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight && !revealedRef.current) {
      revealedRef.current = true;
      setShowScoring(true);
      onScoringRevealed?.(columnIndex);
    }
  }, [columnIndex, onScoringRevealed]);

  // Auto-scroll to scoring when it appears
  useEffect(() => {
    if (showScoring && scoringRef.current) {
      setTimeout(() => {
        scoringRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showScoring]);

  const badgeClass = BADGE_STYLES[label] ?? 'bg-slate-100 text-slate-700';

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
          {label}
        </span>
      </div>

      {/* Scrollable: letter + inline scoring */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {/* Letter text */}
        <div className="px-4 py-4 space-y-4">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">{section.heading}</h3>
              <p className="text-sm text-slate-600 leading-relaxed text-justify">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Inline scoring — revealed when scrolled to bottom */}
        {showScoring && (
          <div ref={scoringRef} className="scoring-enter border-t border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {t('phase1.scoringTitle')}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="space-y-3">
              {dimensions.map(dim => (
                <DimensionRating
                  key={dim.id}
                  dimension={dim}
                  value={scores[dim.id]}
                  onChange={(v) => onScoreChange(dim.id, v)}
                />
              ))}
            </div>

            <div className="mt-3">
              <textarea
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder={t('phase1.commentPlaceholder')}
                rows={2}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 bg-white rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
