import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStudy } from '../context/StudyContext.tsx';
import ComparisonView from '../components/phase1/ComparisonView.tsx';
import ConfirmModal from '../components/shared/ConfirmModal.tsx';
import type { MaterialSetResult, DimensionDef, MaterialData, ScrollEvent } from '../types/index.ts';
import dimensionsData from '../data/dimensions.json';
import matAwards from '../data/stimuli/material_awards.json';
import matJudging from '../data/stimuli/material_judging.json';
import matScholarly from '../data/stimuli/material_scholarly.json';
import matLeading from '../data/stimuli/material_leading.json';
import matSalary from '../data/stimuli/material_salary.json';

const dimensions: DimensionDef[] = dimensionsData.dimensions as DimensionDef[];
const materials: MaterialData[] = [
  matAwards, matJudging, matScholarly, matLeading, matSalary
] as MaterialData[];

export default function Phase1Page() {
  const { t } = useTranslation();
  const { state, dispatch } = useStudy();
  const navigate = useNavigate();
  const columnOrder = state.counterbalance?.phase1ColumnOrder ?? [0, 1, 2];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  // All material scores: [materialIdx][systemIdx] → { dimId: score }
  const [allScores, setAllScores] = useState<Record<string, number>[][]>(
    () => materials.map(() =>
      [0, 1, 2].map(() => Object.fromEntries(dimensions.map(d => [d.id, 50])))
    )
  );

  // All material comments: [materialIdx][systemIdx] → string
  const [allComments, setAllComments] = useState<string[][]>(
    () => materials.map(() => ['', '', ''])
  );

  // Scoring revealed state: [materialIdx][colIdx] → boolean
  const [allScoringRevealed, setAllScoringRevealed] = useState<boolean[][]>(
    () => materials.map(() => [false, false, false])
  );

  // Track which columns the user has actually interacted with: [materialIdx][colIdx]
  const [allInteracted, setAllInteracted] = useState<boolean[][]>(
    () => materials.map(() => [false, false, false])
  );

  // Scroll events and reading start times (refs to avoid re-renders)
  const allScrollEventsRef = useRef<ScrollEvent[][]>(materials.map(() => []));
  const readingStartsRef = useRef<number[]>(materials.map(() => Date.now()));

  const currentScores = allScores[currentIndex];
  const currentComments = allComments[currentIndex];
  const currentScoringRevealed = allScoringRevealed[currentIndex];
  const currentInteracted = allInteracted[currentIndex];
  // Next enabled when user has touched at least one slider per column
  const allColumnsCompleted = currentInteracted.every(Boolean);

  const updateScore = useCallback((sysIdx: number, dimId: string, value: number) => {
    setAllScores(prev => {
      const copy = prev.map(m => m.map(s => ({ ...s })));
      copy[currentIndex][sysIdx] = { ...copy[currentIndex][sysIdx], [dimId]: value };
      return copy;
    });
    // Mark this column as interacted
    setAllInteracted(prev => {
      const copy = prev.map(m => [...m]);
      if (!copy[currentIndex][sysIdx]) {
        copy[currentIndex][sysIdx] = true;
        return copy;
      }
      return prev; // no change, avoid re-render
    });
  }, [currentIndex]);

  const updateComment = useCallback((sysIdx: number, value: string) => {
    setAllComments(prev => {
      const copy = prev.map(m => [...m]);
      copy[currentIndex][sysIdx] = value;
      return copy;
    });
  }, [currentIndex]);

  const handleScoringRevealed = useCallback((colIdx: number) => {
    setAllScoringRevealed(prev => {
      const copy = prev.map(m => [...m]);
      copy[currentIndex][colIdx] = true;
      return copy;
    });
  }, [currentIndex]);

  const handleScroll = useCallback((event: ScrollEvent) => {
    allScrollEventsRef.current[currentIndex].push(event);
  }, [currentIndex]);

  const buildAllResults = (): MaterialSetResult[] => {
    return materials.map((mat, matIdx) => {
      const orderedSources = columnOrder.map(i => mat.sources[i]);
      const colOrderIds = orderedSources.map(s => s.sourceId);
      const readingDuration = Math.round((Date.now() - readingStartsRef.current[matIdx]) / 1000);

      return {
        materialId: mat.materialId,
        columnOrder: colOrderIds,
        readingDuration,
        scrollEvents: allScrollEventsRef.current[matIdx],
        ratings: ['System A', 'System B', 'System C'].map((label, i) => ({
          systemLabel: label,
          sourceId: colOrderIds[i],
          scores: allScores[matIdx][i],
          comment: allComments[matIdx][i],
        })),
      };
    });
  };

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < materials.length - 1) {
      // Reset reading start for next material if first visit
      if (!allScoringRevealed[currentIndex + 1].some(Boolean)) {
        readingStartsRef.current[currentIndex + 1] = Date.now();
      }
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last material — show confirm before submitting
      setShowConfirm(true);
    }
  }, [currentIndex, allScoringRevealed]);

  const doFinalSubmit = () => {
    setShowConfirm(false);
    const results = buildAllResults();
    dispatch({ type: 'SET_PHASE1_RESULTS', results });
    dispatch({ type: 'SET_STEP', step: 'phase2' });
    navigate('/phase2');
  };

  const devSkipToPhase3 = () => {
    dispatch({ type: 'SET_STEP', step: 'phase3' });
    navigate('/phase3');
  };

  const currentMaterial = materials[currentIndex];

  const devSkipToPhase2 = () => {
    dispatch({ type: 'SET_STEP', step: 'phase2' });
    navigate('/phase2');
  };

  return (
    <div className="flex flex-col h-full">
      {/* DEV: skip buttons */}
      <div className="fixed bottom-3 left-3 z-50 flex gap-1.5">
        <button
          onClick={devSkipToPhase2}
          className="px-2 py-1 text-[10px] font-medium bg-red-500 text-white rounded opacity-40 hover:opacity-90 transition-opacity duration-200 ease-out"
        >
          DEV &rarr; P2
        </button>
        <button
          onClick={devSkipToPhase3}
          className="px-2 py-1 text-[10px] font-medium bg-purple-500 text-white rounded opacity-40 hover:opacity-90 transition-opacity duration-200 ease-out"
        >
          DEV &rarr; P3
        </button>
      </div>
      <ComparisonView
        key={currentMaterial.materialId}
        material={currentMaterial}
        dimensions={dimensions}
        columnOrder={columnOrder}
        materialIndex={currentIndex}
        totalMaterials={materials.length}
        scores={currentScores}
        comments={currentComments}
        scoringRevealed={currentScoringRevealed}
        onScoreChange={updateScore}
        onCommentChange={updateComment}
        onScoringRevealed={handleScoringRevealed}
        onScroll={handleScroll}
        onBack={currentIndex > 0 ? handleBack : undefined}
        onNext={handleNext}
        allColumnsRevealed={allColumnsCompleted}
        isLastMaterial={currentIndex === materials.length - 1}
      />

      <ConfirmModal
        open={showConfirm}
        title={t('phase1.submitRatings')}
        message={t('phase1.confirmSubmit')}
        confirmText={t('common.submit')}
        cancelText={t('common.cancel')}
        onConfirm={doFinalSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
