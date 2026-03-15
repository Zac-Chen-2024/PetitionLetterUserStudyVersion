import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStudy } from '../context/StudyContext.tsx';
import type { SurveyResponse } from '../types/index.ts';
import PageContainer from '../components/layout/PageContainer.tsx';

export default function PostStudyPage() {
  const { t } = useTranslation();
  const { dispatch } = useStudy();
  const navigate = useNavigate();

  const [responses, setResponses] = useState<SurveyResponse>({
    overallPreference: '',
    openFeedback: '',
  });

  const update = (key: string, value: string | number) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    dispatch({ type: 'SET_POST_STUDY', data: responses });
    dispatch({ type: 'SET_STEP', step: 'thank-you' });
    navigate('/thank-you');
  };

  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">{t('postStudy.title')}</h1>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Overall Preference */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('postStudy.overallPreference')}</label>
          <p className="text-xs text-slate-500 mb-2">{t('postStudy.overallPreferenceDesc')}</p>
          <div className="flex gap-3">
            {Object.entries(t('postStudy.systemOptions', { returnObjects: true }) as Record<string, string>).map(([k, v]) => (
              <button
                key={k}
                onClick={() => update('overallPreference', k)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  responses.overallPreference === k
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Open feedback */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('postStudy.openFeedback')}</label>
          <p className="text-xs text-slate-500 mb-2">{t('postStudy.openFeedbackDesc')}</p>
          <textarea
            value={responses.openFeedback as string}
            onChange={(e) => update('openFeedback', e.target.value)}
            placeholder={t('postStudy.openFeedbackPlaceholder')}
            rows={5}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-2.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          {t('common.submit')}
        </button>
      </div>
    </PageContainer>
  );
}
