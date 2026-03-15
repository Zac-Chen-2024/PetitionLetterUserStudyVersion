import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStudy } from '../context/StudyContext.tsx';
import type { SurveyResponse } from '../types/index.ts';
import TaskWrapper from '../components/phase2/TaskWrapper.tsx';
import PostTaskSurvey from '../components/phase2/PostTaskSurvey.tsx';

type TaskPhase = 'active' | 'survey';

export default function Phase2Page() {
  const { t } = useTranslation();
  const { dispatch } = useStudy();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<TaskPhase>('active');
  const taskStartRef = useRef(Date.now());

  const systemUrl = 'http://localhost:5174/mapping?studyMode=true';

  const handleTaskComplete = () => {
    setPhase('survey');
  };

  const handleSurveySubmit = (survey: SurveyResponse) => {
    const duration = Math.round((Date.now() - taskStartRef.current) / 1000);
    dispatch({
      type: 'SET_PHASE2_RESULT',
      result: {
        duration,
        completed: true,
        likertSurvey: survey,
      },
    });
    dispatch({ type: 'SET_STEP', step: 'phase3' });
    navigate('/phase3');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header -- single row */}
      <div className="px-6 py-2.5 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm shrink-0 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800 tracking-tight">Phase 2/3: Interactive Task</h1>
        {phase === 'active' && (
          <button
            onClick={handleTaskComplete}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.97] transition-all duration-200 ease-out flex items-center gap-1 shadow-sm hover:shadow-md"
          >
            {t('phase2.completeTask')}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {phase === 'active' && (
          <TaskWrapper
            systemUrl={systemUrl}
            onComplete={handleTaskComplete}
          />
        )}
        {phase === 'survey' && (
          <PostTaskSurvey onSubmit={handleSurveySubmit} />
        )}
      </div>
    </div>
  );
}
