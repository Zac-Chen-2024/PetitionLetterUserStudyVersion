import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStudy } from '../context/StudyContext.tsx';
import type { SurveyResponse } from '../types/index.ts';

export default function Phase3Page() {
  const { t } = useTranslation();
  const { dispatch } = useStudy();
  const navigate = useNavigate();

  const [responses, setResponses] = useState<SurveyResponse>({
    openFeedback: '',
  });

  const canSubmit = (responses.openFeedback as string).trim().length > 0;

  const handleSubmit = () => {
    dispatch({ type: 'SET_PHASE3_SURVEY', data: responses });
    dispatch({ type: 'SET_STEP', step: 'thank-you' });
    navigate('/thank-you');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header -- same style as Phase 1 & 2 */}
      <div className="px-6 py-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm shrink-0">
        <h1 className="text-lg font-semibold text-slate-800 tracking-tight">Phase 3/3: Subjective Feedback</h1>
        <p className="text-sm text-slate-500 mt-1">Share your thoughts about the system.</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="w-full px-8 py-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">Open Feedback</h2>
          <p className="text-sm text-slate-500 mb-5 leading-relaxed">Please share any additional thoughts, and comments about your experience.</p>
          <textarea
            value={responses.openFeedback as string}
            onChange={(e) => setResponses({ openFeedback: e.target.value })}
            placeholder="Your thoughts..."
            rows={10}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 resize-none transition-all duration-200 ease-out placeholder:text-slate-300 hover:border-slate-300"
          />

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`
              w-full mt-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ease-out
              ${canSubmit
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] shadow-sm hover:shadow-md'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }
            `}
          >
            {t('common.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
