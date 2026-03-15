import { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PetitionSection, ScrollEvent, DimensionDef } from '../../types/index.ts';
import DimensionRating from './DimensionRating.tsx';

const BADGE_STYLES: Record<string, string> = {
  'System A': 'bg-blue-100 text-blue-700',
  'System B': 'bg-emerald-100 text-emerald-700',
  'System C': 'bg-amber-100 text-amber-700',
};

const ACCENT_COLORS: Record<string, string> = {
  'System A': 'bg-blue-500',
  'System B': 'bg-emerald-500',
  'System C': 'bg-amber-500',
};

interface LetterColumnProps {
  label: string;
  sections: PetitionSection[];
  fontSize?: number;
  columnIndex: number;
  onScroll?: (event: ScrollEvent) => void;
  onScoringRevealed?: (columnIndex: number) => void;
  dimensions: DimensionDef[];
  scores: Record<string, number>;
  onScoreChange: (dimId: string, value: number) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  isScored?: boolean;
  forceShowScoring?: boolean;
}

export default function LetterColumn({
  label, sections, fontSize = 16, columnIndex, onScroll, onScoringRevealed,
  dimensions, scores, onScoreChange, comment, onCommentChange,
  isScored, forceShowScoring,
}: LetterColumnProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scoringRef = useRef<HTMLDivElement>(null);
  const [showScoring, setShowScoring] = useState(forceShowScoring ?? false);
  const revealedRef = useRef(forceShowScoring ?? false);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // Check if scroll hint should show (content overflows but not scrolled to bottom)
  const updateScrollHint = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    setShowScrollHint(hasOverflow && !nearBottom && !revealedRef.current);
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const scrollPercent = el.scrollHeight > el.clientHeight
      ? Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
      : 100;

    // Report scroll event
    onScroll?.({ columnIndex, scrollPercent, timestamp: Date.now() });

    // Update scroll hint visibility
    updateScrollHint();

    // Auto-reveal scoring when scrolled near bottom (within 30px)
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 30 && !revealedRef.current) {
      revealedRef.current = true;
      setShowScoring(true);
      setShowScrollHint(false);
      onScoringRevealed?.(columnIndex);
    }
  }, [columnIndex, onScroll, onScoringRevealed, updateScrollHint]);

  // Check on mount if content doesn't overflow (short content = already at bottom)
  useEffect(() => {
    if (forceShowScoring) return; // Already forced open
    const el = scrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight && !revealedRef.current) {
      revealedRef.current = true;
      setShowScoring(true);
      onScoringRevealed?.(columnIndex);
    } else {
      updateScrollHint();
    }
  }, [columnIndex, onScoringRevealed, updateScrollHint, forceShowScoring]);

  // Auto-scroll to scoring when it appears (only on fresh reveal, not on revisit)
  useEffect(() => {
    if (showScoring && scoringRef.current && !forceShowScoring) {
      setTimeout(() => {
        scoringRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showScoring, forceShowScoring]);

  const badgeClass = BADGE_STYLES[label] ?? 'bg-slate-100 text-slate-700';
  const accentColor = ACCENT_COLORS[label] ?? 'bg-slate-400';

  return (
    <div className="flex flex-col bg-white border border-slate-200/80 rounded-lg shadow-sm overflow-hidden relative transition-shadow duration-200 ease-out">
      {/* Header with accent bar */}
      <div className="shrink-0">
        <div className={`h-[2.5px] ${accentColor} transition-all duration-300`} />
        <div className="px-4 py-2.5 border-b border-slate-100/80 flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-tight ${badgeClass}`}>
            {label}
          </span>
          {/* Completion checkmark */}
          {isScored && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 scoring-enter shadow-[0_0_0_2px_rgba(16,185,129,0.08)]">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Scrollable: letter + inline scoring */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {/* Letter text */}
        <div className="px-4 py-4 space-y-4">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-slate-800 mb-1.5 tracking-tight" style={{ fontSize: `${fontSize}px` }}>{section.heading}</h3>
              <p className="text-slate-600 leading-relaxed text-justify" style={{ fontSize: `${fontSize}px` }}>{section.content}</p>
            </div>
          ))}
        </div>

        {/* Inline scoring -- revealed when scrolled to bottom or forced */}
        {showScoring && (
          <div ref={scoringRef} className={`bg-slate-50/80 px-4 py-4 ${forceShowScoring ? '' : 'scoring-enter'}`}>
            {/* Animated blue divider line */}
            <div className={`h-[2px] bg-blue-500/80 rounded-full mb-4 ${forceShowScoring ? '' : 'divider-expand'}`} />

            {/* Scoring header with icon */}
            <div className={forceShowScoring ? '' : 'scoring-controls-enter'}>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  {t('phase1.scoringTitle')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                {t('phase1.scoringInstruction')}
              </p>

              <div className="space-y-2.5">
                {dimensions.map(dim => (
                  <DimensionRating
                    key={dim.id}
                    dimension={dim}
                    value={scores[dim.id]}
                    onChange={(v) => onScoreChange(dim.id, v)}
                  />
                ))}
              </div>

              <div className="mt-3 relative">
                <textarea
                  value={comment}
                  onChange={(e) => onCommentChange(e.target.value)}
                  placeholder={t('phase1.commentPlaceholder')}
                  rows={2}
                  maxLength={500}
                  className="w-full px-2.5 py-2 text-xs border border-slate-200 bg-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all duration-200 ease-out placeholder:text-slate-300"
                />
                <span className="absolute bottom-2 right-2.5 text-[9px] text-slate-300 tabular-nums">
                  {comment.length}/500
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scroll gradient hint overlay */}
      {showScrollHint && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className="h-20 bg-gradient-to-t from-white via-white/70 to-transparent" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bounce-arrow">
            <div className="w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
