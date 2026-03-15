import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SurveyResponse } from '../../types/index.ts';
import ScoreSlider from '../phase1/ScoreSlider.tsx';

interface PostTaskSurveyProps {
  onSubmit: (responses: SurveyResponse) => void;
}

const QUESTIONS = [
  { id: 'mentalDemand', labelKey: 'postTask.mentalDemand', descKey: 'postTask.mentalDemandDesc' },
  { id: 'effort', labelKey: 'postTask.effort', descKey: 'postTask.effortDesc' },
  { id: 'frustration', labelKey: 'postTask.frustration', descKey: 'postTask.frustrationDesc' },
  { id: 'satisfaction', labelKey: 'postTask.satisfaction', descKey: 'postTask.satisfactionDesc' },
] as const;

export default function PostTaskSurvey({ onSubmit }: PostTaskSurveyProps) {
  const { t } = useTranslation();
  const [responses, setResponses] = useState<SurveyResponse>(
    Object.fromEntries(QUESTIONS.map(q => [q.id, 50]))
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-1">{t('postTask.title')}</h2>
      <p className="text-sm text-slate-500 mb-6">{t('phase2.taskComplete')}</p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {QUESTIONS.map(q => (
          <div key={q.id}>
            <div className="mb-2">
              <span className="text-sm font-medium text-slate-700">{t(q.labelKey)}</span>
              <p className="text-xs text-slate-400">{t(q.descKey)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-14 text-right shrink-0">{t('postTask.low')}</span>
              <div className="flex-1">
                <ScoreSlider
                  value={responses[q.id] as number}
                  onChange={(v) => setResponses(prev => ({ ...prev, [q.id]: v }))}
                />
              </div>
              <span className="text-xs text-slate-400 w-14 shrink-0">{t('postTask.high')}</span>
            </div>
          </div>
        ))}

        <button
          onClick={() => onSubmit(responses)}
          className="w-full py-2.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          {t('common.submit')}
        </button>
      </div>
    </div>
  );
}
